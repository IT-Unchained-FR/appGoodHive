import * as yup from "yup";

export const talentProfileValidation = yup.object().shape({
  availability: yup.boolean().required("Availability is required"),
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  country: yup.string().required("Country is required"),
  city: yup.string().required("City is required"),
  phone_country_code: yup.string().required("Phone country code is required"),
  phone_number: yup
    .string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Phone number must contain only digits"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  about_work: yup.string().required("About work is required"),
  cv_url: yup.string().url("Invalid URL format").required("CV URL is required"),
  skills: yup.mixed().required("Skills are required"),
  telegram: yup.string().required("Telegram is required"),
  min_rate: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? undefined : value,
    )
    .min(0, "Minimum rate must be at least 0"),
  max_rate: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? undefined : value,
    )
    .min(0, "Maximum rate must be at least 0")
    .when("min_rate", (minRate, schema) =>
      minRate !== undefined
        ? schema.min(minRate as number, "Maximum rate must be at least minimum rate")
        : schema,
    ),
}).test(
  "rate-range",
  "Provide both minimum and maximum hourly rates",
  (value) => {
    const minRate = value?.min_rate;
    const maxRate = value?.max_rate;
    if (minRate === undefined && maxRate === undefined) {
      return true;
    }
    return minRate !== undefined && maxRate !== undefined;
  },
);
