// src/components/common/PrivateRoute.js
import React from 'react';

function PrivateRoute({ children }) {
  // Simply return the children without any authentication checks
  return children;
}

export default PrivateRoute;