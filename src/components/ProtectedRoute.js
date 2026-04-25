import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, ...rest }) {
  const { user } = useContext(AuthContext);
  return (
    <Route {...rest} render={() => (user ? children : <Redirect to="/login" />)} />
  );
}
