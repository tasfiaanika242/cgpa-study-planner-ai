export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message || 'Invalid request'
    return res.status(400).json({ message: msg })
  }
  req.body = parsed.data // sanitized
  next()
}
