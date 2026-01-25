const router = require("express").Router();
const CommentModel = require("../models/Comment.model");
const { isAuthenticated } = require("../middlewares/jwt.middlewares");

// GET all comments
router.get("/", async (req, res) => {
  try {
    const allComments = await CommentModel.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json(allComments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Failed to fetch comments" });
  }
});

// GET a single comment by ID
router.get("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await CommentModel.findById(commentId).populate(
      "user",
      "username email"
    );
    if (!comment) {
      return res.status(404).json({ errorMessage: "Comment not found" });
    }
    res.status(200).json(comment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Failed to fetch comment" });
  }
});

// POST create a new comment (requires authentication)
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.payload._id;

    if (!comment) {
      return res
        .status(400)
        .json({ errorMessage: "Comment is required" });
    }

    const newComment = await CommentModel.create({
      rating: rating || 5,
      comment,
      user: userId,
    });

    const populatedComment = await CommentModel.findById(newComment._id).populate(
      "user",
      "username email"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Failed to create comment" });
  }
});

// PUT update a comment by ID (requires authentication, only owner can edit)
router.put("/:commentId", isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.payload._id;

    const existingComment = await CommentModel.findById(commentId);

    if (!existingComment) {
      return res.status(404).json({ errorMessage: "Comment not found" });
    }

    // Check if the logged-in user is the owner of the comment
    if (existingComment.user.toString() !== userId) {
      return res.status(403).json({ errorMessage: "You can only edit your own comments" });
    }

    const updatedComment = await CommentModel.findByIdAndUpdate(
      commentId,
      { rating, comment },
      { new: true, runValidators: true }
    ).populate("user", "username email");

    res.status(200).json(updatedComment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Failed to update comment" });
  }
});

// DELETE a comment by ID (requires authentication, only owner can delete)
router.delete("/:commentId", isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.payload._id;
    const userRole = req.payload.role;

    const existingComment = await CommentModel.findById(commentId);

    if (!existingComment) {
      return res.status(404).json({ errorMessage: "Comment not found" });
    }

    // Check if the logged-in user is the owner or an admin
    if (existingComment.user.toString() !== userId && userRole !== "Admin") {
      return res.status(403).json({ errorMessage: "You can only delete your own comments" });
    }

    await CommentModel.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Failed to delete comment" });
  }
});

module.exports = router;
