/** Generado desde OpenAPI. Ejecutar npm run contracts:sync; no editar manualmente. */
export interface paths {
    "/api/v1/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_live"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Verificar estado de salud del backend y base de datos */
        get: operations["HealthController_getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Registrar nueva cuenta de cliente */
        post: operations["AuthController_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Iniciar sesión con correo y contraseña */
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cerrar y revocar sesión actual */
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Restaurar sesión web y protección CSRF */
        get: operations["AuthController_session"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener perfil del usuario autenticado */
        get: operations["AuthController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Actualizar datos propios sin modificar roles, estado o membresías */
        patch: operations["AuthController_updateProfile"];
        trace?: never;
    };
    "/api/v1/admin/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminUsersController_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminUsersController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["AdminUsersController_change"];
        trace?: never;
    };
    "/api/v1/geography/zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GeographyController_zones"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/addresses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GeographyController_addresses"];
        put?: never;
        post: operations["GeographyController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/addresses/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["GeographyController_remove"];
        options?: never;
        head?: never;
        patch: operations["GeographyController_update"];
        trace?: never;
    };
    "/api/v1/me/addresses/{id}/default": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["GeographyController_default"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminZonesController_list"];
        put?: never;
        post: operations["AdminZonesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/zones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["AdminZonesController_update"];
        trace?: never;
    };
    "/api/v1/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar comercios activos */
        get: operations["StoresController_listStores"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle público de comercio */
        get: operations["StoresController_getStoreById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StoreManagementController_categories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StoreManagementController_list"];
        put?: never;
        post: operations["StoreManagementController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StoreManagementController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["StoreManagementController_update"];
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/hours": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["StoreManagementController_hours"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StoreManagementController_members"];
        put: operations["StoreManagementController_setMember"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/members/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["StoreManagementController_revoke"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminStoresController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminStoresController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stores/{id}/decisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminStoresController_decide"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stores/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminStoresController_approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/products/{id}/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CatalogManagementController_image"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/products/{id}/images/{imageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["CatalogManagementController_removeImage"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/media/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_imageFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/products/{id}/media/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_ownImageFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/catalog/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_categories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/catalog/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stores/{id}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_storeProducts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_own"];
        put?: never;
        post: operations["CatalogManagementController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_ownDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CatalogManagementController_update"];
        trace?: never;
    };
    "/api/v1/merchant/products/{id}/skus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CatalogManagementController_addSku"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/skus/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CatalogManagementController_updateSku"];
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/inventory": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_inventory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/skus/{id}/stock-adjustments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CatalogManagementController_adjust"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/skus/{id}/movements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogManagementController_movements"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_avatar"];
        put: operations["ProfileMediaController_setAvatar"];
        post?: never;
        delete: operations["ProfileMediaController_removeAvatar"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/avatar/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_avatarImage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/branding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_branding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/branding/{kind}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ProfileMediaController_setBranding"];
        post?: never;
        delete: operations["ProfileMediaController_removeBranding"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/branding/{kind}/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_ownBrandImage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stores/{id}/branding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_publicBranding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stores/{id}/branding/{kind}/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProfileMediaController_brandImage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/purchases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Crear compra e iniciar reserva de inventario (Idempotente) */
        post: operations["OrderingController_createPurchase"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/purchases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Consultar historial de compras del cliente */
        get: operations["OrderingController_getUserPurchases"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}/cancellations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancelar un pedido antes de su preparación (libera reservas de stock) */
        post: operations["OrderingController_cancelOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{storeId}/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar comandas de una tienda (Panel de Comercio) */
        get: operations["OrderingController_getStoreOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/orders/{id}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Comercio acepta pedido (pending -> confirmed) */
        post: operations["OrderingController_acceptOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/orders/{id}/start-preparation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Comercio inicia preparación en cocina (confirmed -> preparing) */
        post: operations["OrderingController_startPreparation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/orders/{id}/mark-ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Comercio marca pedido listo para recojo (preparing -> ready) */
        post: operations["OrderingController_markReady"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/checkout/quote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OrderFlowController_quote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_own"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/order-feed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_merchant"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_admin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_courier"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/purchases/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_purchase"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/checkout-attempts/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_attempt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/orders/{id}/rejections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OrderFlowController_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/courier-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderFlowController_couriers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/checkout/groups/quote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GroupCheckoutController_quote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/checkout/groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GroupCheckoutController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/checkout-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GroupCheckoutController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/group-checkout-attempts/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GroupCheckoutController_attempt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/available-orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar pedidos listos para recojo en espera de repartidor */
        get: operations["DeliveryController_listAvailableOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/active-assignment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener la entrega actualmente activa del repartidor */
        get: operations["DeliveryController_getActiveAssignment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/orders/{id}/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Repartidor toma un pedido listo para entrega (claim) */
        post: operations["DeliveryController_claimOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/assignments/{id}/pickup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Repartidor retira pedido del comercio (descuenta stock físico on_hand) */
        post: operations["DeliveryController_pickupDelivery"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/assignments/{id}/deliver": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Repartidor entrega pedido al cliente (confirma cobro de efectivo) */
        post: operations["DeliveryController_completeDelivery"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/assignments/{id}/release": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["DeliveryController_release"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/assignments/{id}/incidents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["DeliveryController_incident"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders/{id}/assignment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminDeliveryController_assign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/assignments/{id}/release": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminDeliveryController_release"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CourierProfileController_own"];
        put: operations["CourierProfileController_apply"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/profile/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CourierProfileController_availability"];
        trace?: never;
    };
    "/api/v1/admin/couriers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminCouriersController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/couriers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminCouriersController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/couriers/{id}/decisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AdminCouriersController_decide"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlatformController_page"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["PlatformController_readAll"];
        trace?: never;
    };
    "/api/v1/me/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["PlatformController_read"];
        trace?: never;
    };
    "/api/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener notificaciones del usuario autenticado */
        get: operations["PlatformController_getNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Marcar notificación como leída */
        patch: operations["PlatformController_markAsRead"];
        trace?: never;
    };
    "/api/v1/admin/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ReportController_admin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/merchant/stores/{id}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ReportController_merchant"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/courier/earnings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ReportController_courier"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ReportController_audit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/operations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OperationsController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/favorites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EngagementController_favorites"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/favorites/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["EngagementController_addProduct"];
        post?: never;
        delete: operations["EngagementController_removeProduct"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/favorites/stores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["EngagementController_addStore"];
        post?: never;
        delete: operations["EngagementController_removeStore"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["EngagementController_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stores/{id}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EngagementController_reviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportController_list"];
        put?: never;
        post: operations["SupportController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportController_adminList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SupportController_adminDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tickets/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["SupportController_message"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tickets/{id}/decisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["SupportController_decide"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payment-methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BillingQueryController_methods"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/purchases/{id}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BillingQueryController_own"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorResponseDto: {
            statusCode: number;
            error: string;
            code: string;
            message: string | string[];
            /** Format: uuid */
            requestId: string;
            /** Format: date-time */
            timestamp: string;
            path: string;
        };
        RegisterDto: {
            /** @example Juan Pérez */
            fullName: string;
            /** @example juan.perez@example.com */
            email: string;
            /**
             * @description Número en formato E.164 (+51...)
             * @example +51962123456
             */
            phone: string;
            /** @example Password123! */
            password: string;
        };
        MembershipDto: {
            /** Format: uuid */
            storeId: string;
            storeName: string;
            /** @enum {string} */
            storeStatus: "pending" | "active" | "rejected" | "suspended";
            /** @enum {string} */
            membershipRole: "owner" | "manager" | "operator";
        };
        UserProfileDto: {
            /** Format: uuid */
            id: string;
            fullName: string;
            email: string;
            phone: string;
            roles: ("customer" | "merchant" | "courier" | "admin")[];
            /** @enum {string} */
            status: "active" | "pending" | "suspended";
            /** Format: date-time */
            createdAt: string;
            memberships: components["schemas"]["MembershipDto"][];
            /** Format: uuid */
            courierId: string | null;
        };
        AuthResponseDto: {
            user: components["schemas"]["UserProfileDto"];
            /** @description Protección CSRF; conservar solo en memoria */
            csrfToken: string;
            /** Format: date-time */
            expiresAt: string;
        };
        LoginDto: {
            /** @example juan.perez@example.com */
            email: string;
            /** @example Password123! */
            password: string;
        };
        UpdateProfileDto: {
            fullName?: string;
            email?: string;
            phone?: string;
        };
        AdminOverviewDto: {
            pendingStores: number;
            pendingCouriers: number;
            activeStores: number;
            activeCouriers: number;
            activeUsers: number;
            suspendedUsers: number;
        };
        AdminUserDto: {
            /** Format: uuid */
            id: string;
            fullName: string;
            email: string;
            phone: string;
            /** @enum {string} */
            status: "active" | "pending" | "suspended";
            roles: string[];
            /** Format: date-time */
            createdAt: string;
            statusReason: string | null;
        };
        AdminUserListDto: {
            items: components["schemas"]["AdminUserDto"][];
            nextCursor: string | null;
        };
        UserStatusDto: {
            /** @enum {string} */
            status: "active" | "suspended";
            reason: string;
        };
        ZoneDto: {
            /** Format: uuid */
            id: string;
            code: string;
            name: string;
            description: string;
            baseFeeCents: number;
            estimatedMinutes: number;
            isActive: boolean;
        };
        AddressDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            zoneId: string;
            zoneName: string;
            zoneActive: boolean;
            label: string;
            recipientName: string;
            phone: string;
            street: string;
            streetNumber: string;
            reference: string;
            isDefault: boolean;
            latitude: number | null;
            longitude: number | null;
        };
        CreateAddressDto: {
            /** Format: uuid */
            zoneId: string;
            label: string;
            recipientName: string;
            phone: string;
            street: string;
            streetNumber: string;
            reference?: string;
            latitude?: number | null;
            longitude?: number | null;
            isDefault?: boolean;
        };
        UpdateAddressDto: {
            /** Format: uuid */
            zoneId?: string;
            label?: string;
            recipientName?: string;
            phone?: string;
            street?: string;
            streetNumber?: string;
            reference?: string;
            latitude?: number | null;
            longitude?: number | null;
            isDefault?: boolean;
        };
        ZoneListDto: {
            items: components["schemas"]["ZoneDto"][];
            nextCursor: string | null;
        };
        CreateZoneDto: {
            code: string;
            name: string;
            description?: string;
            baseFeeCents: number;
            estimatedMinutes: number;
            isActive?: boolean;
        };
        UpdateZoneDto: {
            code?: string;
            name?: string;
            description?: string;
            baseFeeCents?: number;
            estimatedMinutes?: number;
            isActive?: boolean;
            reason: string;
        };
        StoreCategoryDto: {
            code: string;
            label: string;
        };
        StoreDto: {
            /** Format: uuid */
            id: string;
            name: string;
            categoryCode: string;
            /** Format: uuid */
            zoneId: string;
            zoneName: string;
            description: string;
            addressText: string;
            phone: string;
            legalBusinessName: string | null;
            taxId: string | null;
            /** @enum {string} */
            status: "pending" | "active" | "rejected" | "suspended";
            statusReason: string | null;
            acceptingOrders: boolean;
            isOpen: boolean;
            minimumOrderCents: number;
            preparationMinutes: number;
            /** Format: date-time */
            createdAt: string;
            /** @enum {string} */
            membershipRole: "owner" | "manager" | "operator" | "admin";
        };
        StoreListDto: {
            items: components["schemas"]["StoreDto"][];
            nextCursor: string | null;
        };
        CreateStoreDto: {
            categoryCode: string;
            /** Format: uuid */
            zoneId: string;
            name: string;
            addressText: string;
            phone: string;
            description?: string;
            legalBusinessName?: string | null;
            taxId?: string | null;
            minimumOrderCents?: number;
            preparationMinutes?: number;
        };
        OpeningIntervalDto: {
            weekday: number;
            /** @example 09:00 */
            opensAt: string;
            /** @example 22:00 */
            closesAt: string;
        };
        StoreDetailDto: {
            /** Format: uuid */
            id: string;
            name: string;
            categoryCode: string;
            /** Format: uuid */
            zoneId: string;
            zoneName: string;
            description: string;
            addressText: string;
            phone: string;
            legalBusinessName: string | null;
            taxId: string | null;
            /** @enum {string} */
            status: "pending" | "active" | "rejected" | "suspended";
            statusReason: string | null;
            acceptingOrders: boolean;
            isOpen: boolean;
            minimumOrderCents: number;
            preparationMinutes: number;
            /** Format: date-time */
            createdAt: string;
            /** @enum {string} */
            membershipRole: "owner" | "manager" | "operator" | "admin";
            openingIntervals: components["schemas"]["OpeningIntervalDto"][];
        };
        UpdateStoreDto: {
            categoryCode?: string;
            /** Format: uuid */
            zoneId?: string;
            name?: string;
            addressText?: string;
            phone?: string;
            description?: string;
            legalBusinessName?: string | null;
            taxId?: string | null;
            minimumOrderCents?: number;
            preparationMinutes?: number;
            acceptingOrders?: boolean;
        };
        ReplaceHoursDto: {
            intervals: components["schemas"]["OpeningIntervalDto"][];
        };
        StoreMemberDto: {
            /** Format: uuid */
            userId: string;
            fullName: string;
            email: string;
            /** @enum {string} */
            membershipRole: "owner" | "manager" | "operator";
            isActive: boolean;
        };
        SetStoreMemberDto: {
            email: string;
            /** @enum {string} */
            membershipRole: "manager" | "operator";
        };
        OperationalDecisionDto: {
            /** @enum {string} */
            decision: "approve" | "reject" | "suspend" | "reactivate";
            reason: string;
        };
        ProductImageInputDto: {
            /** @description PNG RGB/RGBA base64 sin prefijo data URL. Validado y saneado en servidor. */
            content: string;
            altText: string;
            position: number;
        };
        CatalogSkuDto: {
            id: string;
            skuCode: string;
            variantName: string;
            priceCents: number;
            barcode: string | null;
            isActive: boolean;
            availableStock: number;
        };
        CatalogImageDto: {
            id: string;
            url: string;
            altText: string;
            position: number;
        };
        CatalogProductDto: {
            id: string;
            storeId: string;
            storeName: string;
            categoryId: string;
            name: string;
            description: string;
            brand: string | null;
            isActive: boolean;
            position: number;
            skus: components["schemas"]["CatalogSkuDto"][];
            images: components["schemas"]["CatalogImageDto"][];
        };
        CategoryDto: {
            id: string;
            code: string;
            name: string;
        };
        CatalogPageDto: {
            items: components["schemas"]["CatalogProductDto"][];
            nextCursor: string | null;
        };
        PublishProductDto: {
            skuCode: string;
            variantName: string;
            /** @description Precio absoluto en céntimos PEN */
            priceCents: number;
            barcode?: string;
            initialStock: number;
            lowStockThreshold?: number;
            categoryId: string;
            name: string;
            description?: string;
            brand?: string;
        };
        CreatedProductDto: {
            productId: string;
            productName: string;
            skuId: string;
            skuCode: string;
            priceCents: number;
            initialStock: number;
        };
        UpdateProductDto: {
            categoryId?: string;
            name?: string;
            description?: string;
            brand?: string;
            position?: number;
            isActive?: boolean;
        };
        CreateSkuDto: {
            skuCode: string;
            variantName: string;
            /** @description Precio absoluto en céntimos PEN */
            priceCents: number;
            barcode?: string;
            initialStock: number;
            lowStockThreshold?: number;
        };
        UpdateSkuDto: {
            skuCode?: string;
            variantName?: string;
            priceCents?: number;
            barcode?: string;
            isActive?: boolean;
            lowStockThreshold?: number;
        };
        InventoryItemDto: {
            skuId: string;
            productId: string;
            productName: string;
            skuCode: string;
            variantName: string;
            onHand: number;
            reserved: number;
            available: number;
            lowStockThreshold: number;
            lowStock: boolean;
        };
        StockAdjustmentDto: {
            /** @description Variación física; nunca reemplaza el stock ni las reservas */
            quantity: number;
            reason: string;
        };
        InventoryMovementDto: {
            id: string;
            kind: string;
            quantity: number;
            onHandAfter: number;
            reason: string;
            actorUserId: string | null;
            createdAt: string;
        };
        AvatarDto: {
            url: string | null;
        };
        ImageContentDto: {
            /** @description PNG RGB/RGBA base64 sin prefijo data URL; hasta 2 MB y 1600 × 1600. */
            content: string;
        };
        StoreBrandingDto: {
            logoUrl: string | null;
            bannerUrl: string | null;
        };
        PurchaseItemDto: {
            /**
             * @description ID del SKU a comprar
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            skuId: string;
            /**
             * @description Cantidad deseada
             * @example 2
             */
            quantity: number;
            /** @example Sin ají */
            note?: string;
        };
        CreatePurchaseDto: {
            /** @description Total revisado por el cliente; se compara con el cálculo vigente del servidor */
            expectedTotalCents?: number;
            /** @description Importe previsto en céntimos; omitir/null significa importe exacto calculado por servidor */
            cashTenderCents?: number | null;
            /**
             * @description ID de la dirección de entrega del usuario
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            addressId: string;
            /**
             * @description Efectivo; digital se habilitará en F6
             * @example cash
             * @enum {string}
             */
            paymentMethod: "cash";
            items: components["schemas"]["PurchaseItemDto"][];
        };
        CancelOrderDto: {
            expectedVersion: number;
            /** @example Cliente solicitó cambio de planes */
            reason: string;
        };
        VersionDto: {
            expectedVersion: number;
        };
        OrderLineDto: {
            skuId: string;
            productName: string;
            variantName: string;
            quantity: number;
            unitPriceCents: number;
            note: string;
        };
        QuoteDto: {
            storeId: string;
            storeName: string;
            subtotalCents: number;
            deliveryFeeCents: number;
            totalCents: number;
            cashTenderCents: number;
            cashChangeCents: number;
            items: components["schemas"]["OrderLineDto"][];
            paymentMethods: string[];
        };
        AssignmentSummaryDto: {
            id: string;
            courierUserId: string;
            status: string;
            version: number;
            agreedFeeCents: number;
        };
        OrderSummaryDto: {
            checkoutGroupId?: string | null;
            id: string;
            purchaseId: string;
            code: string;
            storeId: string;
            storeName: string;
            status: string;
            version: number;
            subtotalCents: number;
            deliveryFeeCents: number;
            totalCents: number;
            paymentStatus: string;
            cashTenderCents: number | null;
            cashReceivedCents: number | null;
            collectedByUserId: string | null;
            createdAt: string;
            acceptanceExpiresAt: string | null;
            assignment: components["schemas"]["AssignmentSummaryDto"] | null;
        };
        OrderPageDto: {
            items: components["schemas"]["OrderSummaryDto"][];
            nextCursor: string | null;
        };
        IncidentDto: {
            id: string;
            description: string;
            createdAt: string;
        };
        DestinationDto: {
            recipientName: string;
            phone: string;
            street: string;
            streetNumber: string;
            reference: string;
        };
        TimelineEventDto: {
            status: string;
            reason: string;
            occurredAt: string;
        };
        OrderDetailDto: {
            checkoutGroupId?: string | null;
            id: string;
            purchaseId: string;
            code: string;
            storeId: string;
            storeName: string;
            status: string;
            version: number;
            subtotalCents: number;
            deliveryFeeCents: number;
            totalCents: number;
            paymentStatus: string;
            cashTenderCents: number | null;
            cashReceivedCents: number | null;
            collectedByUserId: string | null;
            createdAt: string;
            acceptanceExpiresAt: string | null;
            assignment: components["schemas"]["AssignmentSummaryDto"] | null;
            incidents?: components["schemas"]["IncidentDto"][];
            items: components["schemas"]["OrderLineDto"][];
            destination: components["schemas"]["DestinationDto"] | null;
            events: components["schemas"]["TimelineEventDto"][];
        };
        CourierChoiceDto: {
            userId: string;
            fullName: string;
        };
        GroupQuoteDto: {
            stores: components["schemas"]["QuoteDto"][];
            subtotalCents: number;
            deliveryFeeCents: number;
            totalCents: number;
        };
        GroupOrderDto: {
            orderId: string;
            purchaseId: string;
            storeId: string;
            storeName: string;
            code: string;
            status: string;
            paymentStatus: string;
            totalCents: number;
            subtotalCents: number;
            deliveryFeeCents: number;
        };
        GroupCheckoutDto: {
            id: string;
            createdAt: string;
            totalCents: number;
            deliveryFeeCents: number;
            subtotalCents: number;
            orders: components["schemas"]["GroupOrderDto"][];
        };
        DeliverCashDto: {
            expectedVersion: number;
            /** @description Efectivo recibido y confirmado por el repartidor, en céntimos */
            cashReceivedCents: number;
        };
        AssignCourierDto: {
            expectedVersion: number;
            /** @example Cliente solicitó cambio de planes */
            reason: string;
            courierUserId: string;
        };
        CourierProfileDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            userId: string;
            fullName: string;
            email: string;
            phone: string;
            /** @enum {string} */
            vehicleType: "motorcycle" | "bicycle" | "mototaxi";
            plate: string | null;
            /** Format: uuid */
            zoneId: string | null;
            zoneName: string | null;
            /** @enum {string} */
            status: "pending" | "active" | "rejected" | "suspended";
            statusReason: string | null;
            isOnline: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        ApplyCourierDto: {
            /** @enum {string} */
            vehicleType: "motorcycle" | "bicycle" | "mototaxi";
            plate?: string | null;
            /** Format: uuid */
            zoneId: string;
        };
        CourierAvailabilityDto: {
            isOnline: boolean;
        };
        CourierListDto: {
            items: components["schemas"]["CourierProfileDto"][];
            nextCursor: string | null;
        };
        NotificationItem: {
            id: string;
            title: string;
            message: string;
            kind: string;
            relativeUrl: string | null;
            readAt: string | null;
            createdAt: string;
        };
        NotificationPage: {
            items: components["schemas"]["NotificationItem"][];
            nextCursor: string | null;
            unreadCount: number;
        };
        ReportResult: {
            from: string;
            to: string;
            currency: string;
            definition: string;
            orders: number;
            delivered: number;
            cancelled: number;
            deliveredSalesCents: number;
            cashCollectedCents: number;
            courierFeesCents: number;
        };
        AuditItem: {
            id: string;
            actorUserId: string | null;
            action: string;
            entityType: string;
            entityId: string;
            requestId: string;
            occurredAt: string;
        };
        AuditPage: {
            items: components["schemas"]["AuditItem"][];
            nextCursor: string | null;
        };
        OperationsDto: {
            checkedAt: string;
            pendingEvents: number;
            retryingEvents: number;
            oldestPendingEventSeconds: number | null;
            expiredPendingOrders: number;
            activeAssignments: number;
            openTickets: number;
            poolTotal: number;
            poolIdle: number;
            poolWaiting: number;
            alerts: string[];
        };
        FavoriteItem: {
            id: string;
            /** @enum {string} */
            kind: "product" | "store";
            name: string;
            available: boolean;
        };
        FavoritePage: {
            items: components["schemas"]["FavoriteItem"][];
            nextCursor: string | null;
        };
        ReviewInput: {
            rating: number;
            comment?: string;
        };
        ReviewItem: {
            id: string;
            rating: number;
            comment: string | null;
            createdAt: string;
        };
        ReviewPage: {
            items: components["schemas"]["ReviewItem"][];
            nextCursor: string | null;
            count: number;
            average: number | null;
        };
        TicketItem: {
            id: string;
            subject: string;
            status: string;
            priority: string;
            version: number;
            createdAt: string;
            resolvedAt: string | null;
            orderId: string | null;
        };
        TicketPage: {
            items: components["schemas"]["TicketItem"][];
            nextCursor: string | null;
        };
        TicketMessage: {
            id: string;
            authorUserId: string;
            body: string;
            createdAt: string;
        };
        TicketDetail: {
            id: string;
            subject: string;
            status: string;
            priority: string;
            version: number;
            createdAt: string;
            resolvedAt: string | null;
            orderId: string | null;
            messages: components["schemas"]["TicketMessage"][];
        };
        TicketInput: {
            body: string;
            subject: string;
            /** Format: uuid */
            orderId?: string;
        };
        MessageInput: {
            body: string;
        };
        TicketDecision: {
            body: string;
            expectedVersion: number;
            /** @enum {string} */
            status: "open" | "in_review" | "resolved";
            /** @enum {string} */
            priority: "low" | "normal" | "high";
        };
        PaymentMethodDto: {
            code: string;
            label: string;
            available: boolean;
            unavailableReason: string | null;
        };
        RefundSummaryDto: {
            id: string;
            orderId: string;
            amountCents: number;
            /** @enum {string} */
            status: "pending" | "processing" | "succeeded" | "failed";
            createdAt: string;
            succeededAt: string | null;
        };
        PaymentAttemptDto: {
            id: string;
            methodCode: string;
            /** @enum {string} */
            status: "pending" | "processing" | "succeeded" | "failed" | "cancelled";
            amountCents: number;
            createdAt: string;
            succeededAt: string | null;
            refunds: components["schemas"]["RefundSummaryDto"][];
        };
        PaymentHistoryDto: {
            items: components["schemas"]["PaymentAttemptDto"][];
            nextCursor: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    HealthController_live: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_session: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserProfileDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AuthController_updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserProfileDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponseDto"];
                };
            };
        };
    };
    AdminUsersController_overview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminOverviewDto"];
                };
            };
        };
    };
    AdminUsersController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                status?: "active" | "pending" | "suspended";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminUserListDto"];
                };
            };
        };
    };
    AdminUsersController_change: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserStatusDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GeographyController_zones: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDto"][];
                };
            };
        };
    };
    GeographyController_addresses: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"][];
                };
            };
        };
    };
    GeographyController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAddressDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"];
                };
            };
        };
    };
    GeographyController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GeographyController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAddressDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"];
                };
            };
        };
    };
    GeographyController_default: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddressDto"];
                };
            };
        };
    };
    AdminZonesController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneListDto"];
                };
            };
        };
    };
    AdminZonesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateZoneDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDto"];
                };
            };
        };
    };
    AdminZonesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateZoneDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ZoneDto"];
                };
            };
        };
    };
    StoresController_listStores: {
        parameters: {
            query?: {
                category?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoresController_getStoreById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoreManagementController_categories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreCategoryDto"][];
                };
            };
        };
    };
    StoreManagementController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreListDto"];
                };
            };
        };
    };
    StoreManagementController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateStoreDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    StoreManagementController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    StoreManagementController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateStoreDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    StoreManagementController_hours: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplaceHoursDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    StoreManagementController_members: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreMemberDto"][];
                };
            };
        };
    };
    StoreManagementController_setMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetStoreMemberDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StoreManagementController_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminStoresController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                status?: "pending" | "active" | "rejected" | "suspended";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreListDto"];
                };
            };
        };
    };
    AdminStoresController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    AdminStoresController_decide: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OperationalDecisionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    AdminStoresController_approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreDetailDto"];
                };
            };
        };
    };
    CatalogManagementController_image: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductImageInputDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_removeImage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                imageId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogManagementController_imageFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
        };
    };
    CatalogManagementController_ownImageFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
        };
    };
    CatalogManagementController_categories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryDto"][];
                };
            };
        };
    };
    CatalogManagementController_search: {
        parameters: {
            query?: {
                q?: string;
                category?: string;
                storeId?: string;
                zoneId?: string;
                minPriceCents?: number;
                maxPriceCents?: number;
                available?: "true" | "false";
                limit?: number;
                /** @description Último UUID; productos ordenados por posición/ID, movimientos por fecha/ID */
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogPageDto"];
                };
            };
        };
    };
    CatalogManagementController_storeProducts: {
        parameters: {
            query?: {
                q?: string;
                category?: string;
                storeId?: string;
                zoneId?: string;
                minPriceCents?: number;
                maxPriceCents?: number;
                available?: "true" | "false";
                limit?: number;
                /** @description Último UUID; productos ordenados por posición/ID, movimientos por fecha/ID */
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogPageDto"];
                };
            };
        };
    };
    CatalogManagementController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_own: {
        parameters: {
            query?: {
                q?: string;
                category?: string;
                storeId?: string;
                zoneId?: string;
                minPriceCents?: number;
                maxPriceCents?: number;
                available?: "true" | "false";
                limit?: number;
                /** @description Último UUID; productos ordenados por posición/ID, movimientos por fecha/ID */
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogPageDto"];
                };
            };
        };
    };
    CatalogManagementController_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublishProductDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedProductDto"];
                };
            };
        };
    };
    CatalogManagementController_ownDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProductDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_addSku: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSkuDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_updateSku: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSkuDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogProductDto"];
                };
            };
        };
    };
    CatalogManagementController_inventory: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryItemDto"][];
                };
            };
        };
    };
    CatalogManagementController_adjust: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StockAdjustmentDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryMovementDto"];
                };
            };
        };
    };
    CatalogManagementController_movements: {
        parameters: {
            query?: {
                q?: string;
                category?: string;
                storeId?: string;
                zoneId?: string;
                minPriceCents?: number;
                maxPriceCents?: number;
                available?: "true" | "false";
                limit?: number;
                /** @description Último UUID; productos ordenados por posición/ID, movimientos por fecha/ID */
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryMovementDto"][];
                };
            };
        };
    };
    ProfileMediaController_avatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvatarDto"];
                };
            };
        };
    };
    ProfileMediaController_setAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImageContentDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvatarDto"];
                };
            };
        };
    };
    ProfileMediaController_removeAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvatarDto"];
                };
            };
        };
    };
    ProfileMediaController_avatarImage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
        };
    };
    ProfileMediaController_branding: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreBrandingDto"];
                };
            };
        };
    };
    ProfileMediaController_setBranding: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                kind: "logo" | "banner";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImageContentDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreBrandingDto"];
                };
            };
        };
    };
    ProfileMediaController_removeBranding: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                kind: "logo" | "banner";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreBrandingDto"];
                };
            };
        };
    };
    ProfileMediaController_ownBrandImage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                kind: "logo" | "banner";
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
        };
    };
    ProfileMediaController_publicBranding: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreBrandingDto"];
                };
            };
        };
    };
    ProfileMediaController_brandImage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                kind: "logo" | "banner";
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": string;
                };
            };
        };
    };
    OrderingController_createPurchase: {
        parameters: {
            query?: never;
            header: {
                /** @description Clave de 1 a 200 caracteres, única por intención de compra */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePurchaseDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_getUserPurchases: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_cancelOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_getStoreOrders: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                storeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_acceptOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VersionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_startPreparation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VersionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderingController_markReady: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VersionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderFlowController_quote: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePurchaseDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QuoteDto"];
                };
            };
        };
    };
    OrderFlowController_own: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                storeId?: string;
                status?: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled" | "rejected";
                scope?: "available" | "active" | "history";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderPageDto"];
                };
            };
        };
    };
    OrderFlowController_merchant: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                storeId?: string;
                status?: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled" | "rejected";
                scope?: "available" | "active" | "history";
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderPageDto"];
                };
            };
        };
    };
    OrderFlowController_admin: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                storeId?: string;
                status?: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled" | "rejected";
                scope?: "available" | "active" | "history";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderPageDto"];
                };
            };
        };
    };
    OrderFlowController_courier: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                storeId?: string;
                status?: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled" | "rejected";
                scope?: "available" | "active" | "history";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderPageDto"];
                };
            };
        };
    };
    OrderFlowController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderDetailDto"];
                };
            };
        };
    };
    OrderFlowController_purchase: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderDetailDto"];
                };
            };
        };
    };
    OrderFlowController_attempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderDetailDto"];
                };
            };
        };
    };
    OrderFlowController_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderFlowController_couriers: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                storeId?: string;
                status?: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled" | "rejected";
                scope?: "available" | "active" | "history";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierChoiceDto"][];
                };
            };
        };
    };
    GroupCheckoutController_quote: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePurchaseDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupQuoteDto"];
                };
            };
        };
    };
    GroupCheckoutController_create: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePurchaseDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupCheckoutDto"];
                };
            };
        };
    };
    GroupCheckoutController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupCheckoutDto"];
                };
            };
        };
    };
    GroupCheckoutController_attempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupCheckoutDto"];
                };
            };
        };
    };
    DeliveryController_listAvailableOrders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_getActiveAssignment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_claimOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VersionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_pickupDelivery: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VersionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_completeDelivery: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeliverCashDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_release: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeliveryController_incident: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminDeliveryController_assign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignCourierDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminDeliveryController_release: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CourierProfileController_own: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierProfileDto"];
                };
            };
        };
    };
    CourierProfileController_apply: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplyCourierDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierProfileDto"];
                };
            };
        };
    };
    CourierProfileController_availability: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CourierAvailabilityDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierProfileDto"];
                };
            };
        };
    };
    AdminCouriersController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
                status?: "pending" | "active" | "rejected" | "suspended";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierListDto"];
                };
            };
        };
    };
    AdminCouriersController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierProfileDto"];
                };
            };
        };
    };
    AdminCouriersController_decide: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OperationalDecisionDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CourierProfileDto"];
                };
            };
        };
    };
    PlatformController_page: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationPage"];
                };
            };
        };
    };
    PlatformController_readAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformController_read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformController_getNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PlatformController_markAsRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ReportController_admin: {
        parameters: {
            query?: {
                /** @description Inicio inclusivo ISO 8601 con zona horaria; predeterminado últimos 30 días */
                from?: string;
                /** @description Fin exclusivo ISO 8601 con zona horaria; predeterminado ahora */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportResult"];
                };
            };
        };
    };
    ReportController_merchant: {
        parameters: {
            query?: {
                /** @description Inicio inclusivo ISO 8601 con zona horaria; predeterminado últimos 30 días */
                from?: string;
                /** @description Fin exclusivo ISO 8601 con zona horaria; predeterminado ahora */
                to?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportResult"];
                };
            };
        };
    };
    ReportController_courier: {
        parameters: {
            query?: {
                /** @description Inicio inclusivo ISO 8601 con zona horaria; predeterminado últimos 30 días */
                from?: string;
                /** @description Fin exclusivo ISO 8601 con zona horaria; predeterminado ahora */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportResult"];
                };
            };
        };
    };
    ReportController_audit: {
        parameters: {
            query?: {
                /** @description Cursor bigint decimal */
                cursor?: string;
                action?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditPage"];
                };
            };
        };
    };
    OperationsController_status: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OperationsDto"];
                };
            };
        };
    };
    EngagementController_favorites: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FavoritePage"];
                };
            };
        };
    };
    EngagementController_addProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EngagementController_removeProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EngagementController_addStore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EngagementController_removeStore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EngagementController_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewInput"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItem"];
                };
            };
        };
    };
    EngagementController_reviews: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewPage"];
                };
            };
        };
    };
    SupportController_list: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketPage"];
                };
            };
        };
    };
    SupportController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TicketInput"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketItem"];
                };
            };
        };
    };
    SupportController_adminList: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketPage"];
                };
            };
        };
    };
    SupportController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
        };
    };
    SupportController_adminDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
        };
    };
    SupportController_message: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MessageInput"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SupportController_decide: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TicketDecision"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BillingQueryController_methods: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentMethodDto"][];
                };
            };
        };
    };
    BillingQueryController_own: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentHistoryDto"];
                };
            };
        };
    };
}
