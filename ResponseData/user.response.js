
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