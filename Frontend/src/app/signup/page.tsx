"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import useGoogleOAuth from "./SignupClient";
import Cookies from "js-cookie";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { handleGoogleSignup } = useGoogleOAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://drawexplainbackend-74788697407.europe-west1.run.app'}/api/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          setError(errorData.message || "Signup failed");
        } else {
          const errorText = await response.text();
          setError(`Signup failed: ${response.status} ${response.statusText}`);
        }
        return;
      }

      // Parse response data
      const data = await response.json();

      // Set the token in cookies with a 7-day expiration
      Cookies.set("token", data.token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: "lax" });
      Cookies.set("userId", data.user.id, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: "lax" });
      
      // Redirect to practice page
      router.push("/practice");
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred during signup");
    }
  };

  const content = (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Create your account
        </h2>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {error && (
            <div className='mb-4 text-sm text-red-600 bg-red-100 border border-red-400 rounded p-2'>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Name
              </label>
              <input
                id='name'
                name='name'
                type='text'
                autoComplete='name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label htmlFor='confirm-password' className='block text-sm font-medium text-gray-700'>
                Confirm Password
              </label>
              <input
                id='confirm-password'
                name='confirm-password'
                type='password'
                autoComplete='new-password'
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <button
                type='submit'
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                Sign up
              </button>
            </div>
          </form>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300' />
              </div>
              {/* <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Or continue with</span>
              </div> */}
            </div>

            {/* <div className='mt-6'>
              <button
                onClick={handleGoogleSignup}
                className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
              >
                <FcGoogle className='w-5 h-5 mr-2' />
                Sign up with Google
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-100 flex flex-col justify-center items-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500'></div>
          <p className='mt-4 text-xl font-semibold'>Loading...</p>
        </div>
      }
    >
      {content}
    </Suspense>
  );
}
