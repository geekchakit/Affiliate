


exports.sendWelcomeEmail = (customerName, OTP) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            Thank you for signing up with Your App! We are thrilled to have you as part of our community.
            Your account has been successfully created. To get started, YOUR OTP IS :- ${OTP} `;
}

exports.sendUserWelcomeEmailJoinedViaAdmin = (customerName,password,email) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            Your account has been successfully created by admin. Please login to your account with below credentials.
            Email :- ${email}
            Password :- ${password}`;
};

exports.sendConfirmationForAddedToCampignViaAdmin = (customerName, campaignName) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            You have been successfully added to the campaign ${campaignName} by admin`;
};

exports.sendVerifyEmail = (customerName) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            Your account has been successfully verified please go to login`;
}

exports.sendOtpMessage = (customerName,otp) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
    Dear ${customerName},
    Your OTP is ${otp} to reset your password`;
}

exports.sendCampignAcceptanceEmail = (customerName, campaignName) => {
    return `Welcome To Our AFFILIATE MARKETING Services !
            Dear ${customerName},
            Your campaign ${campaignName} has been successfully accepted by the admin`;
}



exports.signUpResponse = (users) => {

    const user = {
        email: users.email,
        name: users.name,
        user_id: users._id,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        created_at: users.created_at,
        updated_at: users.updated_at
    }
    return user
}


exports.LoginResponse = (users) => {

    const user = {
        user_id: users._id,
        email: users.email,
        name: users.name,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        referal_code: users.referral_code,
        tokens: users.tokens,
        refresh_tokens: users.refresh_tokens,
        created_at: users.created_at,
        updated_at: users.updated_at
    }
    return user
}


exports.updateResponse = (users) => {

    const user = {

        user_id: users._id,
        email: users.email,
        name: users.name,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        is_upload: users.is_upload,
        gender: users.gender,
        city: users.city,
        country: users.country,
        state: users.state,
        pancard: users.pancard,
        address: users.address,
        adharacard: users.adharacard,
        date_of_birth: users.date_of_birth,
    }
    return user
}

exports.accountVerifyResponse = (users) => {

    const user = {
        user_id: users._id,
        email: users.email,
        name: users.name,
        user_type: users.user_type,
        mobile_number: users.mobile_number,
        is_verify: users.is_verify,
    }
    return user
}