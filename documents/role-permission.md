# Roles and Permissions

## Permissions

### Content

- **CONTENT_VIEW**: Xem anime, manga, novel chung
- **ANIME_CREATE**: Tạo nội dung anime
- **MANGA_CREATE**: Tạo nội dung manga
- **NOVEL_CREATE**: Tạo nội dung novel
- **ANIME_EDIT_OWN**: Chỉnh sửa nội dung anime do mình tạo
- **MANGA_EDIT_OWN**: Chỉnh sửa nội dung manga do mình tạo
- **NOVEL_EDIT_OWN**: Chỉnh sửa nội dung novel do mình tạo
- **ANIME_EDIT_ALL**: Chỉnh sửa mọi nội dung anime
- **MANGA_EDIT_ALL**: Chỉnh sửa mọi nội dung manga
- **NOVEL_EDIT_ALL**: Chỉnh sửa mọi nội dung novel
- **ANIME_PUBLISH_IMMEDIATE**: Xuất bản ngay nội dung anime
- **MANGA_PUBLISH_IMMEDIATE**: Xuất bản ngay nội dung manga
- **NOVEL_PUBLISH_IMMEDIATE**: Xuất bản ngay nội dung novel
- **ANIME_SUBMIT_FOR_APPROVAL**: Gửi nội dung anime đi duyệt
- **MANGA_SUBMIT_FOR_APPROVAL**: Gửi nội dung manga đi duyệt
- **NOVEL_SUBMIT_FOR_APPROVAL**: Gửi nội dung novel đi duyệt
- **ANIME_APPROVE**: Duyệt và xuất bản nội dung anime
- **MANGA_APPROVE**: Duyệt và xuất bản nội dung manga
- **NOVEL_APPROVE**: Duyệt và xuất bản nội dung novel
- **ANIME_TRANSLATE_RAW**: Dịch nội dung anime có tag RAW
- **MANGA_TRANSLATE_RAW**: Dịch nội dung manga có tag RAW
- **NOVEL_TRANSLATE_RAW**: Dịch nội dung novel có tag RAW

### Comment

- **COMMENT_VIEW**: Xem bình luận
- **COMMENT_CREATE**: Tạo bình luận
- **COMMENT_EDIT_OWN**: Chỉnh sửa bình luận của mình
- **COMMENT_EDIT_ALL**: Chỉnh sửa mọi bình luận
- **COMMENT_DELETE_OWN**: Xóa bình luận của mình
- **COMMENT_DELETE_ALL**: Xóa mọi bình luận

### User & Group Management

- **USER_VIEW**: Xem danh sách user
- **USER_MANAGE**: Quản lý user (tạo, sửa, xóa)
- **SUBADMIN_MANAGE**: Quản lý sub-admin
- **GROUP_MANAGE**: Quản lý group (tạo, sửa, xóa)
- **GROUP_MEMBER_MANAGE**: Quản lý thành viên trong group

### System

- **SYSTEM_CONFIG**: Thay đổi cấu hình hệ thống

### E‑commerce

- **SELLER_MANAGE_PRODUCT**: Seller quản lý sản phẩm
- **SELLER_VIEW_ORDERS**: Seller xem đơn hàng
- **BUYER_MAKE_ORDER**: Buyer đặt hàng
- **BUYER_VIEW_OWN_ORDERS**: Buyer xem đơn hàng của mình

---

## Roles

> Lưu ý: Một người dùng có thể có nhiều role cùng lúc. Mọi user mặc định có USER role. Danh sách quyền dưới đây chỉ liệt kê các quyền bổ sung so với các role cơ bản hơn để tránh trùng lặp.

### SYSTEM_ADMIN

Quyền:

- FULL_ACCESS (tất cả permissions)

### SUB_ADMIN

Quyền bổ sung:

- USER_MANAGE
- SUBADMIN_MANAGE
- GROUP_MEMBER_MANAGE
- ANIME_CREATE, MANGA_CREATE, NOVEL_CREATE
- ANIME_EDIT_ALL, MANGA_EDIT_ALL, NOVEL_EDIT_ALL
- ANIME_APPROVE, MANGA_APPROVE, NOVEL_APPROVE
- COMMENT_EDIT_ALL

### GROUP_OWNER

Quyền bổ sung so với GROUP_MODERATOR:

- GROUP_MANAGE

### GROUP_MODERATOR

Quyền bổ sung:

- GROUP_MEMBER_MANAGE
- ANIME_CREATE, MANGA_CREATE, NOVEL_CREATE
- ANIME_EDIT_ALL, MANGA_EDIT_ALL, NOVEL_EDIT_ALL
- ANIME_APPROVE, MANGA_APPROVE, NOVEL_APPROVE
- ANIME_TRANSLATE_RAW, MANGA_TRANSLATE_RAW, NOVEL_TRANSLATE_RAW
- COMMENT_EDIT_ALL

### ANIME_CREATOR

Quyền bổ sung:

- ANIME_CREATE
- ANIME_EDIT_OWN
- ANIME_PUBLISH_IMMEDIATE
- ANIME_SUBMIT_FOR_APPROVAL
- ANIME_TRANSLATE_RAW

### MANGA_CREATOR

Quyền bổ sung:

- MANGA_CREATE
- MANGA_EDIT_OWN
- MANGA_PUBLISH_IMMEDIATE
- MANGA_SUBMIT_FOR_APPROVAL
- MANGA_TRANSLATE_RAW

### NOVEL_CREATOR

Quyền bổ sung:

- NOVEL_CREATE
- NOVEL_EDIT_OWN
- NOVEL_PUBLISH_IMMEDIATE
- NOVEL_SUBMIT_FOR_APPROVAL
- NOVEL_TRANSLATE_RAW

### SELLER

Quyền bổ sung:

- SELLER_MANAGE_PRODUCT
- SELLER_VIEW_ORDERS

### BUYER

Quyền bổ sung:

- BUYER_MAKE_ORDER
- BUYER_VIEW_OWN_ORDERS

### USER

Quyền cơ bản:

- CONTENT_VIEW
- COMMENT_VIEW
- COMMENT_CREATE
- COMMENT_EDIT_OWN
- COMMENT_DELETE_OWN
