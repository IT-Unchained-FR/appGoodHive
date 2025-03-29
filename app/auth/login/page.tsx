"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      router.replace("/talents/my-profile");

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
      }
    } catch (error) {
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/talents/my-profile",
        redirect: true,
      });
    } catch (error) {
      toast.error("An error occurred during Google sign in");
    }
  };

  return (
    <main className="m-8">
      <h1 className="my-5 font-bold text-2xl">Login</h1>
      <section className="">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full mt-4 gap-4 sm:flex-col md:flex-col"
        >
          {/* Email Field */}
          <div className="w-6/12 sm:w-full md:w-full">
            <div className="flex-1">
              <label
                htmlFor="email"
                className="inline-block ml-3 mb-2 text-base text-black form-label"
              >
                Email*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 rounded-full bg-clip-padding border border-solid border-[#FFC905]  hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Enter Your Email Address"
                name="email"
                type="email"
                required
                maxLength={100}
              />
            </div>
          </div>
          {/* Password Field */}
          <div className="w-6/12 sm:w-full md:w-full">
            <div className="flex-1">
              <label
                htmlFor="password"
                className="inline-block ml-3 mb-2 text-base text-black form-label"
              >
                Password*
              </label>
              <input
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600  rounded-full bg-clip-padding border border-solid border-[#FFC905] hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Enter Your Password"
                name="password"
                type="password"
                required
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <p>
              If You Don&apos;t Have Any Account{" "}
              <span className="text-[#FFC905] underline">
                <Link href={"/auth/signup"}>Sign Up Here</Link>
              </span>
            </p>
          </div>

          {/* Submit Button */}
          {isLoading ? (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
              type="submit"
              disabled
            >
              Loading...
            </button>
          ) : (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-10 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
              type="submit"
            >
              Login
            </button>
          )}
        </form>

        {/* Google Sign In */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-56 flex items-center justify-center px-4 py-2 border border-[#FFC905] rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC905]"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
