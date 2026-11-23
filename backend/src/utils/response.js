function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, message, status = 400, details = undefined) {
  const body = { success: false, message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, failure };
