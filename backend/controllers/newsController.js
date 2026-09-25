import News from '../models/News.js';

const parsePublishedDate = (value) => {
  if (!value) return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Parse date-only values in local time to prevent UTC day-shift.
    return new Date(`${value}T00:00:00`);
  }
  return new Date(value);
};

// Create News
export const createNews = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.publishedDate) {
      payload.publishedDate = parsePublishedDate(payload.publishedDate);
    }

    const news = await News.create(payload);

    res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All News
export const getAllNews = async (req, res) => {
  try {
    const news = await News.find({ isPublished: true }).sort({ publishedDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single News
export const getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
      });
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update News
export const updateNews = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.publishedDate) {
      payload.publishedDate = parsePublishedDate(payload.publishedDate);
    }

    const news = await News.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
      });
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete News
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};