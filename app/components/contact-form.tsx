"use client";

import React from "react";
import { useForm, ValidationError } from "@formspree/react";

const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID as string;

export default function ContactForm() {
  
  const [state, handleSubmit] = useForm(formId);

  if (state.succeeded) {
    return (
      <p className="text-base text-green-500">
        Thanks for reaching out! We&apos;ve received your message and our team
        will get back to you shortly.
      </p>
    );
  }
  return (
    <div>
      <form className="max-w-md" onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="name"
            className="block mb-2 text-base font-medium text-gray-900"
          >
            Your Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="bg-gray-50 border border-yellow-500 text-gray-900 text-sm rounded-lg focus:border-[#FFC905] focus:border-2 focus:outline-none block w-full p-2.5"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="email"
            className="block mb-2 text-base font-medium text-gray-900"
          >
            Your Email
          </label>
          <input
            name="email"
            id="email"
            type="email"
            className="bg-gray-50 border border-yellow-500 text-gray-900 text-sm rounded-lg focus:border-[#FFC905] focus:border-2 focus:outline-none block w-full p-2.5"
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <ValidationError prefix="Email" field="email" errors={state.errors} />
        <div className="mb-5">
          <label
            htmlFor="message"
            className="block mb-2 text-base font-medium text-gray-900"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="min-h-[150px] bg-gray-50 border border-yellow-500 text-gray-900 text-sm rounded-lg focus:border-[#FFC905] focus:border-2 focus:outline-none block w-full p-2.5"
            placeholder="Your message"
            required
          ></textarea>
        </div>
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
        />
        <button
          type="submit"
          disabled={state.submitting}
          className="text-white bg-[#FFC905] hover:bg-opacity-80 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-base w-full sm:w-auto px-5 py-2.5 text-center"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
