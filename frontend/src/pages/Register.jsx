import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register: registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm();
  
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      console.log('Form submitted with data:', data);
      setLoading(true);
      setError('');
      
      // Remove confirmPassword as it's not needed for the API
      const { confirmPassword, ...registerData } = data;
      
      const result = await registerUser(registerData);
      console.log('Registration result:', result);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Unexpected error during form submission:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="text-center mb-4">Register</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group mb-3">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name.message}</div>
                )}
              </div>
              
              <div className="form-group mb-3">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>
              
              <div className="form-group mb-3">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
              
              <div className="form-group mb-4">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => 
                      value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            
            <div className="mt-3 text-center">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 