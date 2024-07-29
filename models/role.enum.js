const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin'
};

const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        'create_edit_delete_campaigns',
        'add_update_delete_category_and_assign_special_category',
        'upload_and_revise_excel',
        'add_user_to_campaign_or_accept_user',
        'handle_payment_requests',
        'add_edit_verify_delete_user',
        'add_delete_banner',
        'edit_own_profile'
    ],
    [ROLES.ADMIN]: [
        'create_edit_delete_campaigns',
        'add_update_delete_category_and_assign_special_category',
        'upload_and_revise_excel',
        'add_user_to_campaign_or_accept_user',
        'handle_payment_requests',
        'add_edit_verify_delete_user',
        'add_delete_banner',
        'edit_own_profile'
    ]
};

module.exports = { ROLES, ROLE_PERMISSIONS };
