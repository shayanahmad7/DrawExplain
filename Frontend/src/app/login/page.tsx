"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import useGoogleOAuth from "./LoginClient";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { handleGoogleLogin } = useGoogleOAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://drawexplain-138149752130.europe-west1.run.app'}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Set the token and userId in cookies with a 7-day expiration
        Cookies.set("token", data.token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: "lax" });
        Cookies.set("userId", data.user.id, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: "lax" });

        router.push("/practice");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    }
  };

  const content = (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Log in to your account
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
                autoComplete='current-password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <button
                type='submit'
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                Log in
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
                onClick={handleGoogleLogin}
                className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
              >
                <FcGoogle className='w-5 h-5 mr-2' />
                Log in with Google
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
