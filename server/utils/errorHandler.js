// Helper function to handle errors
export const handleError = (res, error, defaultMessage = "Internal server error") => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [API Error]`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.errors && { errors: error.errors })
  });

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: error.errors.map(e => e.message).join(', '),
      details: error.errors
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: "Dữ liệu đã tồn tại",
      field: error.errors?.[0]?.path
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: "Không thể thực hiện thao tác do ràng buộc khóa ngoại"
    });
  }

  res.status(500).json({
    error: error.message || defaultMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      name: error.name 
    })
  });
};

export const safeCount = async (model, options = {}) => {
  try {
    return await model.count(options);
  } catch (error) {
    const modelName = model?.name || "UnknownModel";
    console.warn(`⚠️ [DB] Count failed for ${modelName}:`, error.message);
    return 0;
  }
};

