"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const schema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  subject: yup.string().optional(),
  message: yup
    .string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters"),
});

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          type: "contact-us",
          subject: data.subject
            ? `New Contact Message from ${data.name}: ${data.subject}`
            : `New Contact Message from ${data.name}`,
        }),
      });

      if (response.ok) {
        toast.success(
          "🍯 Message sent successfully! We'll buzz back to you soon!",
        );
        setIsSubmitted(true);
        reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-green-50 rounded-2xl border-2 border-green-200">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          Message Sent Successfully! 🐝
        </h3>
        <p className="text-green-600">
          Thanks for reaching out! We&apos;ve received your message and our team
          will get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-4 text-green-700 hover:text-green-800 font-semibold underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="name"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Your Name*
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1 ml-3">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Your Email*
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="john.doe@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1 ml-3">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="subject"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Subject
          </label>
          <input
            type="text"
            id="subject"
            {...register("subject")}
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
            placeholder="What can we help you with?"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
          >
            Message*
          </label>
          <textarea
            id="message"
            {...register("message")}
            rows={5}
            className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
            placeholder="Tell us more about your needs or questions..."
          ></textarea>
          {errors.message && (
            <p className="text-red-500 text-sm mt-1 ml-3">{errors.message.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg flex items-center justify-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center">
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Send Message
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
