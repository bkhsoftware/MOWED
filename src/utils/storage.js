const storage = {
  setItem(key, value) {
    return localStorage.setItem(key, JSON.stringify(value))
  },
  getItem(key) {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  },
  removeItem(key) {
    return localStorage.removeItem(key)
  }
}

export default storage
