import * as yup from "yup";

export const companyProfileValidation = yup.object().shape({
  headline: yup.string().required("Headline is required"),
  designation: yup.string().required("Designation is required"),
  country: yup.string().required("Country is required"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  phone_country_code: yup.string().required("Phone country code is required"),
  phone_number: yup
    .string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Phone number must contain only digits"),
  telegram: yup.string().required("Telegram is required"),
});
