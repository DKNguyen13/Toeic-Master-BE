export function success(res, message = "Success", data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function error(res, message = "Error", statusCode = 500, errors = null) {
  return res.status(statusCode).json({ success: false, message, errors });
}
