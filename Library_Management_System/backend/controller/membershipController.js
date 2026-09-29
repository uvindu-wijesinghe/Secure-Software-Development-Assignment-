// controller/membershipController.js - COMPLETE FIX
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");

async function uploadMembershipSlip(req, res) {
  try {
    const userId = req.userId;
    const { expiryDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload a payment slip" 
      });
    }

    // Find current user first
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const slipImage = `/uploads/${req.file.filename}`;
    const membershipExpiry = expiryDate ? 
      new Date(expiryDate) : 
      new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    
    // FIXED: Use $set to ensure proper update
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: {
          membershipStatus: "PENDING", // Explicitly set to PENDING
          membershipExpiry: membershipExpiry,
          "membershipPayment.slipImage": slipImage,
          "membershipPayment.uploadedAt": new Date(),
          "membershipPayment.approvedAt": null,
          "membershipPayment.approvedBy": null
        }
      }
    );

    const updatedUser = await User.findById(userId);
    
    res.json({ 
      success: true, 
      message: "Membership slip uploaded successfully! Please wait for admin approval.",
      data: updatedUser 
    });
    
  } catch (err) {
    console.error("Error uploading membership slip:", err);
    
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error uploading membership slip: " + err.message 
    });
  }
}

async function approveMembership(req, res) {
  try {
    const { userId } = req.body;
    const adminId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.membershipStatus === "ACTIVE") {
      return res.status(400).json({ 
        success: false, 
        message: "User membership is already active" 
      });
    }

    if (!user.membershipPayment || !user.membershipPayment.slipImage) {
      return res.status(400).json({
        success: false,
        message: "No payment slip found for this user"
      });
    }

    // Update user membership status
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: {
          membershipStatus: "ACTIVE",
          "membershipPayment.approvedAt": new Date(),
          "membershipPayment.approvedBy": adminId
        }
      }
    );

    const updatedUser = await User.findById(userId);
    
    res.json({ 
      success: true, 
      message: "Membership approved successfully!",
      data: updatedUser 
    });
    
  } catch (err) {
    console.error("Error approving membership:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error approving membership: " + err.message 
    });
  }
}

async function getAllPendingMemberships(req, res) {
  try {
    // First, find all users who have uploaded payment slips
    const usersWithPaymentSlips = await User.find({
      "membershipPayment.slipImage": { $exists: true, $ne: null, $ne: "" }
    }).select('name email registrationNumber membershipPayment membershipExpiry membershipStatus createdAt');

    // Filter for those who are still pending (not yet approved)
    const pendingUsers = usersWithPaymentSlips.filter(user => {
      const isPending = user.membershipStatus === "PENDING";
      const notApproved = !user.membershipPayment?.approvedAt;
      const hasSlip = user.membershipPayment?.slipImage;
      
      // Show users who are either PENDING or have uploaded slips but not yet approved
      return (isPending || notApproved) && hasSlip;
    });

    const finalResult = pendingUsers.length > 0 ? pendingUsers : usersWithPaymentSlips;
    
    res.json({ 
      success: true, 
      data: finalResult,
    });
    
  } catch (err) {
    console.error("Error in getAllPendingMemberships:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching pending memberships: " + err.message 
    });
  }
}

// Additional helper function to fix existing data
async function fixExistingMembershipData(req, res) {
  try {
    // Find users who have uploaded payment slips but status might be wrong
    const usersToFix = await User.find({
      "membershipPayment.slipImage": { $exists: true, $ne: null },
      $or: [
        { membershipStatus: { $ne: "PENDING" } },
        { membershipStatus: { $exists: false } }
      ]
    });

    for (const user of usersToFix) {
      // Only set to PENDING if not already ACTIVE
      if (user.membershipStatus !== "ACTIVE") {
        await User.updateOne(
          { _id: user._id },
          { $set: { membershipStatus: "PENDING" } }
        );
      }
    }

    res.json({
      success: true,
      message: `Fixed ${usersToFix.length} users`,
      data: usersToFix.map(u => ({ name: u.name, oldStatus: u.membershipStatus }))
    });
    
  } catch (error) {
    console.error("Error fixing data:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  uploadMembershipSlip,
  approveMembership,
  getAllPendingMemberships,
  fixExistingMembershipData
};