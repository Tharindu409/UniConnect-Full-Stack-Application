import Project from "../models/Project.js";
import Comment from "../models/Comment.js";

// Create Project
export const createProject = async (req, res) => {
  try {
    if (req.files && req.files.length > 3) {
      return res.status(400).json({ message: "You can upload up to 3 images" });
    }

    const images = req.files ? req.files.map((file) => file.filename) : [];

    const project = new Project({
      projectName: req.body.projectName,
      description: req.body.description,
      category: req.body.category,
      clubName: req.body.clubName,
      projectDate: req.body.projectDate,
      status: req.body.status,
      images,
    });

    await project.save();

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Project
export const updateProject = async (req, res) => {
  try {
    if (req.files && req.files.length > 3) {
      return res.status(400).json({ message: "You can upload up to 3 images" });
    }

    let keptExistingImages = [];

    if (typeof req.body.existingImages !== "undefined") {
      if (Array.isArray(req.body.existingImages)) {
        keptExistingImages = req.body.existingImages.filter(Boolean);
      } else if (typeof req.body.existingImages === "string") {
        try {
          const parsed = JSON.parse(req.body.existingImages);
          keptExistingImages = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          keptExistingImages = [];
        }
      }
    }

    const newImages = req.files ? req.files.map((file) => file.filename) : [];

    if (keptExistingImages.length + newImages.length > 3) {
      return res.status(400).json({ message: "You can upload up to 3 images" });
    }

    const updateData = {
      projectName: req.body.projectName,
      description: req.body.description,
      category: req.body.category,
      clubName: req.body.clubName,
      projectDate: req.body.projectDate,
      status: req.body.status,
    };

    if (typeof req.body.existingImages !== "undefined" || newImages.length > 0) {
      updateData.images = [...keptExistingImages, ...newImages];
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like Project
export const likeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = String(req.user?._id || "");

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const alreadyLiked = project.likedBy.some(
      (id) => String(id) === userId
    );

    if (alreadyLiked) {
      project.likedBy = project.likedBy.filter((id) => String(id) !== userId);
      project.likes = Math.max(0, Number(project.likes || 0) - 1);
    } else {
      project.likedBy.push(req.user._id);
      project.likes = Number(project.likes || 0) + 1;
    }

    await project.save();

    res.status(200).json({
      likes: project.likes,
      liked: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Always use the authenticated user's name for comment identity
    const userName = req.user?.fullName || "Anonymous";

    const comment = new Comment({
      projectId: req.params.id,
      userName,
      text,
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Comments
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      projectId: req.params.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const deleted = await Comment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};