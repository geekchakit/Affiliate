


exports.sendWelcomeEmail = (customerName, OTP) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            Thank you for signing up with Your App! We are thrilled to have you as part of our community.
            Your account has been successfully created. To get started, YOUR OTP IS :- ${OTP} `;
}



exports.signUpResponse = (users) => {

    const user = {
        email: users.email,
        userName: users.userName,
        full_name: users.full_name,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        campaign: users.campaign,
        created_at: users.created_at,
        updated_at: users.updated_at
    }
    return user
}


exports.LoginResponse = (users) => {

    const user = {
        email: users.email,
        userName: users.userName,
        full_name: users.full_name,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        tokens: users.tokens,
        refresh_tokens: users.refresh_tokens,
        campaign: users.campaign,
        created_at: users.created_at,
        updated_at: users.updated_at
    }
    return user
}