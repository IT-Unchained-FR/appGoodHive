export const generateJobTypeEngage = (typeEngagement: string) => {
    switch (typeEngagement) {
        case "freelance":
            return "Open for freelancer";
        case "remote":
            return "Open for employee";
        case "any":
            return "Open for freelancer or employee";
        default:
            return "Open for freelancer or employee";
    }
}