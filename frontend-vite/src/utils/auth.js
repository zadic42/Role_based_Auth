// Get the authentication token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Set the authentication token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Get the user data from localStorage
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Set the user data in localStorage
export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Check if user is admin
export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

// Check if user is trainer
export const isTrainer = () => {
  const user = getUser();
  return user?.role === 'trainer';
};

// Get authorization header for API requests
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Logout user
export const logout = () => {
  setAuthToken(null);
  setUser(null);
}; 