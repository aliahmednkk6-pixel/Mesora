document.addEventListener("DOMContentLoaded", () => {

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // Reveal all mesora-reveal sections IMMEDIATELY (runs first, before any other
    // initialization, so a later runtime error in this bundle can never leave the
    // page's sections hidden — previously this ran last and could be skipped entirely).
    try {
        document.querySelectorAll('.mesora-reveal').forEach((el) => el.classList.add('is-visible'));
    } catch (e) { /* no-op: ensure visibility never throws */ }

    // ==========================================================================
    // Hero Build Video — يستبدل الشعار بفيديو التجميعة إذا توفر الملف فقط
    // ضع ملفك في: picture/pc-build.mp4 (أو غيّر المسار بالأسفل)
    // ==========================================================================
    try {
        const heroWrap = document.querySelector('.hero-3d-wrap');
        const VIDEO_SRC = 'picture/pc-build.mp4';
        if (heroWrap && !prefersReducedMotion && !heroWrap.dataset.videoLoaded) {
            heroWrap.dataset.videoLoaded = '1';
            fetch(VIDEO_SRC, { method: 'HEAD' })
                .then((r) => {
                    if (!r.ok) return; // الملف غير موجود — نبقى على الشعار
                    const video = document.createElement('video');
                    video.src = VIDEO_SRC;
                    video.autoplay = true;
                    video.muted = true;
                    video.loop = true;
                    video.playsInline = true;
                    video.setAttribute('playsinline', '');
                    video.setAttribute('aria-label', 'عرض متحرك لتجميعة كمبيوتر');
                    video.className = 'hero-build-video';
                    heroWrap.replaceChildren(video);
                })
                .catch(() => { /* تجاهل — أبقِ الشعار */ });
        }
    } catch (e) { /* no-op */ }

    const WHATSAPP_NUMBER = "9647866554424";
    const ACTIVE_COUPONS = {
        "MESORA5": { type: "percent", value: 5, label: "خصم 5% على التجميعة" },
        "IRAQTECH": { type: "flat", value: 25000, label: "خصم بقيمة 25,000 د.ع" },
        "FREESHIP": { type: "free_shipping", value: 0, label: "شحن مجاني لكافة المحافظات" },
        "RTXPOWER": { type: "percent", value: 10, label: "خصم RTX الخارق 10%" }
    };
    let appliedCoupon = null;

    const STOCK_LABELS = {
        available: "متوفر",
        low: "آخر قطعة",
        out: "نفد",
    };

    const buildWhatsAppOrderUrl = (product, price, stock) => {
        const priceText = price
            ? Number(price).toLocaleString("ar-IQ")
            : "";
        const stockText = STOCK_LABELS[stock] || STOCK_LABELS.available;
        const intro = stock === "out"
            ? "مرحباً، أرغب بالاستفسار عن توفر المنتج التالي:"
            : "مرحباً، أرغب بطلب المنتج التالي:";
        const lines = [
            intro,
            `المنتج: ${product}`,
            priceText ? `السعر المعروض: ${priceText} د.ع` : "",
            `الحالة: ${stockText}`,
        ].filter(Boolean);
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    };

    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldReduceMotion = prefersReducedMotion || isSmallScreen;

    // ==========================================================================
    // Ultra-Vibrant Interactive Mouse Spotlight & Cursor Engine
    // ==========================================================================
    const initSpotlightEffect = () => {
        if (prefersReducedMotion || isSmallScreen) {
            const cpuEl = document.getElementById("mesora-cursor-cpu");
            if (cpuEl) cpuEl.remove();
            const glowEl = document.getElementById("mesora-global-glow");
            if (glowEl) glowEl.remove();
            return;
        }

        const selectors = [
            ".mesora-product-card",
            ".mesora-category-card",
            ".mesora-card",
            ".mesora-stat-card",
            ".mesora-step-card",
            ".mesora-testimonial",
            ".hero-trust-item",
            ".mesora-guarantee-box",
            ".mesora-contact-info",
            ".mesora-contact-form",
            ".mesora-faq-item",
            ".mesora-cta",
            ".swiper-slide"
        ].join(", ");

        const updateSpotlightCards = () => {
            document.querySelectorAll(selectors).forEach((card) => {
                card.classList.add("mesora-spotlight-card");
            });
        };
        updateSpotlightCards();

        document.addEventListener("mousemove", (e) => {
            const targetCard = e.target.closest(".mesora-spotlight-card");
            if (targetCard) {
                const rect = targetCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                targetCard.style.setProperty("--mouse-x", `${x}px`);
                targetCard.style.setProperty("--mouse-y", `${y}px`);
                targetCard.style.setProperty("--spotlight-opacity", "1");
            }
        });

        document.addEventListener("mouseout", (e) => {
            const card = e.target.closest(".mesora-spotlight-card");
            if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
                card.style.setProperty("--spotlight-opacity", "0");
            }
        });

        // High Z-Index Global Mouse Spotlight Torch
        let mouseGlow = document.getElementById("mesora-global-glow");
        if (!mouseGlow) {
            mouseGlow = document.createElement("div");
            mouseGlow.id = "mesora-global-glow";
            mouseGlow.className = "mesora-global-glow";
            mouseGlow.setAttribute("aria-hidden", "true");
            document.body.appendChild(mouseGlow);
        }

        // Animated Mini CPU Processor Icon floating with the mouse
        let cpuCursor = document.getElementById("mesora-cursor-cpu");
        if (!cpuCursor) {
            cpuCursor = document.createElement("div");
            cpuCursor.id = "mesora-cursor-cpu";
            cpuCursor.className = "mesora-cursor-cpu";
            cpuCursor.setAttribute("aria-hidden", "true");
            cpuCursor.innerHTML = `
                <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                    <path d="M12 3V7 M20 3V7 M28 3V7 M12 33V37 M20 33V37 M28 33V37 M3 12H7 M3 20H7 M3 28H7 M33 12H37 M33 20H37 M33 28H37" stroke="#C5A059" stroke-width="2.2" stroke-linecap="round" />
                    <rect x="7" y="7" width="26" height="26" rx="5" fill="#0b131c" stroke="#00A3C4" stroke-width="1.8" />
                    <rect x="14" y="14" width="12" height="12" rx="2.5" fill="url(#cpu-core-grad)" stroke="#C5A059" stroke-width="1.2" />
                    <circle cx="10.5" cy="10.5" r="1.3" fill="#00E5FF" />
                    <circle cx="29.5" cy="10.5" r="1.3" fill="#00E5FF" />
                    <circle cx="10.5" cy="29.5" r="1.3" fill="#00E5FF" />
                    <circle cx="29.5" cy="29.5" r="1.3" fill="#00E5FF" />
                    <defs>
                        <linearGradient id="cpu-core-grad" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#00E5FF" />
                            <stop offset="50%" stop-color="#00A3C4" />
                            <stop offset="100%" stop-color="#C5A059" />
                        </linearGradient>
                    </defs>
                </svg>
            `;
            document.body.appendChild(cpuCursor);
        }

        const oldDot = document.getElementById("mesora-cursor-dot");
        if (oldDot) oldDot.remove();

        let lastX = 0;
        let rafId = 0;

        const updateCursorPos = (clientX, clientY) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                const deltaX = clientX - lastX;
                const tilt = Math.max(-18, Math.min(18, deltaX * 0.9));
                lastX = clientX;

                mouseGlow.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
                cpuCursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) rotate(${tilt}deg)`;
            });
        };

        // Desktop Mouse Movement
        window.addEventListener("pointermove", (e) => {
            if (e.pointerType === "touch") return; // Touch handled by touch events below
            mouseGlow.style.opacity = "0.95";
            cpuCursor.style.opacity = "0.95";
            updateCursorPos(e.clientX, e.clientY);
        }, { passive: true });

        // Mobile Touch Tracking — يتابع حركة الإصبع بدقة ومسلاسة على الموبايل
        window.addEventListener("touchstart", (e) => {
            if (e.touches && e.touches[0]) {
                mouseGlow.style.opacity = "0.95";
                cpuCursor.style.opacity = "0.95";
                updateCursorPos(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (e.touches && e.touches[0]) {
                mouseGlow.style.opacity = "0.95";
                cpuCursor.style.opacity = "0.95";
                updateCursorPos(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener("touchend", () => {
            mouseGlow.style.opacity = "0";
            cpuCursor.style.opacity = "0";
        }, { passive: true });

        window.addEventListener("touchcancel", () => {
            mouseGlow.style.opacity = "0";
            cpuCursor.style.opacity = "0";
        }, { passive: true });
    };

    initSpotlightEffect();

    // ==========================================================================
    // Hero 3D Tilt Effect on Logo
    // ==========================================================================
    const hero3DLogo = document.querySelector(".hero-3d-logo");
    if (hero3DLogo && !shouldReduceMotion) {
        const heroWrap = document.querySelector(".hero-3d-wrap");
        if (heroWrap) {
            heroWrap.addEventListener("mousemove", (e) => {
                const rect = heroWrap.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                hero3DLogo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            heroWrap.addEventListener("mouseleave", () => {
                hero3DLogo.style.transform = "";
            });
        }
    }

    const toastEl = document.querySelector("#mesora-toast");
    let toastTimer;
    const showToast = (message) => {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
    };

    // ==========================================================================
    // Sticky Glassmorphic Header & Scroll Blur Effect
    // ==========================================================================
    const mainHeader = document.getElementById("main-header");
    if (mainHeader) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 25) {
                mainHeader.classList.add("mesora-header-scrolled");
            } else {
                mainHeader.classList.remove("mesora-header-scrolled");
            }
        }, { passive: true });
    }

    // ==========================================================================
    // Shopping Cart Drawer & Live State Management Engine
    // ==========================================================================
    let cart = [];
    // استعادة السلة المحفوظة من الجلسة السابقة
    try {
        const savedCart = JSON.parse(localStorage.getItem("mesora_cart") || "[]");
        if (Array.isArray(savedCart)) cart = savedCart.filter(i => i && i.name);
    } catch (e) { /* ignore */ }
    // كشف السلة للنظام (نموذج إتمام الطلب)
    window.__mesoraGetCart = () => cart;

    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-drawer-overlay");
    const cartToggleBtn = document.getElementById("cart-toggle-btn");
    const cartCloseBtn = document.getElementById("cart-drawer-close");
    const cartBadgeCount = document.getElementById("cart-badge-count");
    const cartItemsContainer = document.getElementById("cart-drawer-items");
    const cartEmptyState = document.getElementById("cart-empty-state");
    const cartFooter = document.getElementById("cart-drawer-footer");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const cartSubtitle = document.getElementById("cart-drawer-subtitle");
    const cartCheckoutWhatsapp = document.getElementById("cart-checkout-whatsapp");

    const openCartDrawer = () => {
        if (!cartDrawer || !cartOverlay) return;
        cartDrawer.classList.remove("translate-x-full");
        cartOverlay.classList.remove("opacity-0", "pointer-events-none");
        document.body.style.overflow = "hidden";
    };

    const closeCartDrawer = () => {
        if (!cartDrawer || !cartOverlay) return;
        cartDrawer.classList.add("translate-x-full");
        cartOverlay.classList.add("opacity-0", "pointer-events-none");
        document.body.style.overflow = "";
    };

    if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

    const updateCartUI = () => {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (cartBadgeCount) {
            cartBadgeCount.textContent = totalCount;
            if (totalCount > 0) {
                cartBadgeCount.classList.remove("scale-0");
                cartBadgeCount.classList.add("scale-100");
            } else {
                cartBadgeCount.classList.remove("scale-100");
                cartBadgeCount.classList.add("scale-0");
            }
        }

        if (cartSubtitle) {
            cartSubtitle.textContent = `${totalCount} منتجات مختارة`;
        }

        if (cart.length === 0) {
            if (cartItemsContainer && cartEmptyState) {
                cartItemsContainer.innerHTML = "";
                cartItemsContainer.appendChild(cartEmptyState);
                cartEmptyState.style.display = "flex";
            }
            if (cartFooter) cartFooter.classList.add("hidden");
        } else {
            if (cartEmptyState) cartEmptyState.style.display = "none";
            if (cartFooter) cartFooter.classList.remove("hidden");

            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = cart.map((item, index) => `
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-[#111922] border border-[rgba(0,163,196,0.2)] hover:border-[rgba(0,163,196,0.4)] transition-all">
                        <img src="${item.img}" alt="${item.name}" class="w-14 h-14 object-contain rounded-lg bg-[#0a0f14] p-1 border border-white/5">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-xs font-bold text-white truncate mb-1">${item.name}</h4>
                            <p class="text-xs font-mono text-[#C5A059] font-bold">${(item.price * item.quantity).toLocaleString("ar-IQ")} د.ع</p>
                        </div>
                        <div class="flex items-center gap-1.5 bg-[#0a0f14] px-2 py-1 rounded-lg border border-white/10">
                            <button type="button" class="cart-qty-btn text-[#8A9AAD] hover:text-white text-xs font-bold px-1 cursor-pointer" data-action="minus" data-index="${index}">-</button>
                            <span class="text-xs text-white font-bold w-4 text-center">${item.quantity}</span>
                            <button type="button" class="cart-qty-btn text-[#8A9AAD] hover:text-white text-xs font-bold px-1 cursor-pointer" data-action="plus" data-index="${index}">+</button>
                        </div>
                        <button type="button" class="cart-remove-btn p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" data-index="${index}" title="حذف">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `).join("");

                if (typeof lucide !== "undefined") lucide.createIcons();
            }

            const discountRow = document.getElementById("cart-discount-row");
            const discountValEl = document.getElementById("cart-discount-value");
            let discountAmount = 0;

            if (appliedCoupon && ACTIVE_COUPONS[appliedCoupon]) {
                const coupon = ACTIVE_COUPONS[appliedCoupon];
                if (coupon.type === "percent") {
                    discountAmount = Math.round(totalPrice * (coupon.value / 100));
                } else if (coupon.type === "flat") {
                    discountAmount = coupon.value;
                }

                if (discountRow && discountValEl) {
                    discountRow.classList.remove("hidden");
                    if (coupon.type === "free_shipping") {
                        discountValEl.textContent = "شحن مجاني";
                        discountValEl.className = "font-bold text-xs text-emerald-400";
                    } else {
                        discountValEl.textContent = `-${discountAmount.toLocaleString("ar-IQ")} د.ع`;
                        discountValEl.className = "font-bold text-sm text-emerald-400 font-mono";
                    }
                }
            } else {
                if (discountRow) discountRow.classList.add("hidden");
            }

            const finalPrice = Math.max(0, totalPrice - discountAmount);

            if (cartTotalPrice) {
                cartTotalPrice.textContent = `${finalPrice.toLocaleString("ar-IQ")} د.ع`;
            }
        }

        // حفظ السلة لاستعادتها بعد إغلاق المتصفح
        try { localStorage.setItem("mesora_cart", JSON.stringify(cart)); } catch (e) { /* ignore */ }
    };

    const addToCart = (productData) => {
        const existingIndex = cart.findIndex(item => item.name === productData.name);
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                name: productData.name,
                price: Number(productData.price) || 0,
                img: productData.img || "picture/logo.png",
                quantity: 1
            });
        }
        updateCartUI();
        showToast(`تمت إضافة "${productData.name}" إلى السلة 🛒`);
    };

    // Global Add To Cart Click Handler
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".mesora-product-btn");
        if (btn) {
            e.preventDefault();
            const card = btn.closest(".mesora-product-card, .swiper-slide");
            const name = btn.getAttribute("data-product") || (card ? card.getAttribute("data-name") || card.querySelector("h3")?.textContent : "منتج ميسورا");
            const price = card ? card.getAttribute("data-price") || 0 : 0;
            const img = card ? card.querySelector("img")?.getAttribute("src") : "picture/logo.png";
            addToCart({ name, price, img });
        }

        const qtyBtn = e.target.closest(".cart-qty-btn");
        if (qtyBtn) {
            const index = Number(qtyBtn.getAttribute("data-index"));
            const action = qtyBtn.getAttribute("data-action");
            if (cart[index]) {
                if (action === "plus") {
                    cart[index].quantity += 1;
                } else if (action === "minus") {
                    cart[index].quantity -= 1;
                    if (cart[index].quantity <= 0) {
                        cart.splice(index, 1);
                    }
                }
                updateCartUI();
            }
        }

        const removeBtn = e.target.closest(".cart-remove-btn");
        if (removeBtn) {
            const index = Number(removeBtn.getAttribute("data-index"));
            if (cart[index]) {
                cart.splice(index, 1);
                updateCartUI();
            }
        }
    });

    // WhatsApp Checkout Handler
    if (cartCheckoutWhatsapp) {
        cartCheckoutWhatsapp.addEventListener("click", () => {
            if (cart.length === 0) return;
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemsListText = cart.map((item, idx) => `${idx + 1}. ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString("ar-IQ")} د.ع`).join("\n");
            
            let discountAmount = 0;
            let couponInfoText = "";
            if (appliedCoupon && ACTIVE_COUPONS[appliedCoupon]) {
                const coupon = ACTIVE_COUPONS[appliedCoupon];
                if (coupon.type === "percent") {
                    discountAmount = Math.round(totalPrice * (coupon.value / 100));
                } else if (coupon.type === "flat") {
                    discountAmount = coupon.value;
                }
                couponInfoText = `🎫 *كوبون الخصم المطبق*: ${appliedCoupon} (${coupon.label})`;
            }

            const finalPrice = Math.max(0, totalPrice - discountAmount);
            
            const messageLines = [
                "🛒 *طلب جديد من متجر MESORA*",
                "--------------------------------",
                itemsListText,
                "--------------------------------",
                couponInfoText ? couponInfoText : "",
                couponInfoText && discountAmount > 0 ? `📉 *قيمة الخصم*: -${discountAmount.toLocaleString("ar-IQ")} د.ع` : "",
                `💰 *المجموع الإجمالي*: ${finalPrice.toLocaleString("ar-IQ")} د.ع`,
                "--------------------------------",
                "يرجى تأكيد التوفر وإرسال تفاصيل الشحن والتوصيل."
            ].filter(Boolean);

            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageLines.join("\n"))}`;
            window.open(url, "_blank");
            
            // Show order progress modal after confirming the order
            closeCartDrawer();
            setTimeout(() => {
                const opOverlay = document.getElementById("order-progress-overlay");
                const opModal = document.getElementById("order-progress-modal");
                if (opOverlay && opModal) {
                    opOverlay.classList.remove("opacity-0", "pointer-events-none");
                    opModal.classList.remove("opacity-0", "pointer-events-none", "scale-95");
                    opModal.classList.add("scale-100");
                    document.body.style.overflow = "hidden";
                }
            }, 400);
        });
    }

    // Order Progress Modal Close Handlers
    const opCloseBtn = document.getElementById("order-progress-close");
    const opOverlay = document.getElementById("order-progress-overlay");
    const opModal = document.getElementById("order-progress-modal");
    
    const closeOrderProgress = () => {
        if (!opOverlay || !opModal) return;
        opOverlay.classList.add("opacity-0", "pointer-events-none");
        opModal.classList.add("opacity-0", "pointer-events-none", "scale-95");
        opModal.classList.remove("scale-100");
        document.body.style.overflow = "";
    };
    
    if (opCloseBtn) opCloseBtn.addEventListener("click", closeOrderProgress);
    if (opOverlay) opOverlay.addEventListener("click", closeOrderProgress);

    // ==========================================================================
    // Product Cards Global Reference
    // ==========================================================================
    const productCards = document.querySelectorAll(".mesora-product-card");
    const filterNote = document.querySelector("#featured-filter-note");

    // (Feature 10 old compare engine removed: it redeclared compareList/compareModal
    // in this same scope as the unified compare system below, producing a fatal
    // "Identifier has already been declared" SyntaxError, and referenced elements
    // that do not exist. Comparison is now handled by the drawer/modal system below.)

    // ==========================================================================
    // Feature 11: Order Tracking Engine
    // ==========================================================================
    const trackOverlay = document.getElementById("track-order-overlay");
    const trackModal = document.getElementById("track-order-modal");
    const trackClose = document.getElementById("track-order-close");
    const trackBtn = document.getElementById("track-order-btn");
    const trackInput = document.getElementById("track-order-number");
    const trackResult = document.getElementById("track-order-result");

    const openTrack = () => {
        if (!trackOverlay || !trackModal) return;
        trackOverlay.classList.remove("opacity-0", "pointer-events-none");
        trackModal.classList.remove("opacity-0", "pointer-events-none", "scale-95");
        trackModal.classList.add("scale-100");
        document.body.style.overflow = "hidden";
    };

    const closeTrack = () => {
        if (!trackOverlay || !trackModal) return;
        trackOverlay.classList.add("opacity-0", "pointer-events-none");
        trackModal.classList.add("opacity-0", "pointer-events-none", "scale-95");
        trackModal.classList.remove("scale-100");
        document.body.style.overflow = "";
    };

    if (trackClose) trackClose.addEventListener("click", closeTrack);
    if (trackOverlay) trackOverlay.addEventListener("click", closeTrack);

    if (trackBtn && trackInput && trackResult) {
        trackBtn.addEventListener("click", () => {
            const orderNumber = trackInput.value.trim();
            if (!orderNumber) {
                trackResult.classList.remove("hidden");
                trackResult.innerHTML = `<p class="text-xs text-center text-rose-400 py-4">⚠️ يرجى إدخال رقم الطلب</p>`;
                return;
            }
            // Simulate order tracking (in real app, this would call an API)
            trackResult.classList.remove("hidden");
            trackResult.innerHTML = `
                <div class="bg-[#111922] border border-[rgba(0,163,196,0.2)] rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold text-white">طلب: ${orderNumber}</span>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">قيد المعالجة</span>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 text-xs text-emerald-400">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            <span>تم استلام الطلب</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-[#8A9AAD]">
                            <i data-lucide="package" class="w-3.5 h-3.5"></i>
                            <span>جاري التجهيز والتجميع</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-[#8A9AAD]">
                            <i data-lucide="truck" class="w-3.5 h-3.5"></i>
                            <span>بانتظار الشحن</span>
                        </div>
                    </div>
                    <p class="text-[10px] text-[#8A9AAD] mt-3">للاستفسار عن طلبك تواصل معنا عبر واتساب</p>
                </div>
            `;
            if (typeof lucide !== "undefined") lucide.createIcons();
        });
    }

    // ==========================================================================
    // Interactive Quick Search Modal Engine
    // ==========================================================================
    const searchModalOverlay = document.getElementById("search-modal-overlay");
    const searchModal = document.getElementById("search-modal");
    const searchModalClose = document.getElementById("search-modal-close");
    const modalSearchInput = document.getElementById("modal-search-input");
    const searchResultsContainer = document.getElementById("search-results-container");

    const openSearchModal = () => {
        if (!searchModal || !searchModalOverlay) return;
        searchModalOverlay.classList.remove("opacity-0", "pointer-events-none");
        searchModal.classList.remove("opacity-0", "pointer-events-none", "scale-95");
        searchModal.classList.add("scale-100");
        document.body.style.overflow = "hidden";
        if (modalSearchInput) {
            setTimeout(() => modalSearchInput.focus(), 150);
        }
    };

    const closeSearchModal = () => {
        if (!searchModal || !searchModalOverlay) return;
        searchModalOverlay.classList.add("opacity-0", "pointer-events-none");
        searchModal.classList.add("opacity-0", "pointer-events-none", "scale-95");
        searchModal.classList.remove("scale-100");
        document.body.style.overflow = "";
    };

    const siteSearchInput = document.getElementById("site-search");
    const mobileSiteSearchInput = document.getElementById("mobile-site-search");

    if (siteSearchInput) siteSearchInput.addEventListener("focus", openSearchModal);
    if (mobileSiteSearchInput) mobileSiteSearchInput.addEventListener("focus", openSearchModal);
    if (searchModalClose) searchModalClose.addEventListener("click", closeSearchModal);
    if (searchModalOverlay) searchModalOverlay.addEventListener("click", closeSearchModal);

    // Live Search Logic
    if (modalSearchInput) {
        modalSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (!query) {
                searchResultsContainer.innerHTML = `<p class="text-xs text-center text-[#8A9AAD] py-8">اكتب اسماً في خانة البحث لتظهر لك القطع المتوفرة فورياً...</p>`;
                return;
            }

            const cards = document.querySelectorAll(".mesora-product-card, .swiper-slide");
            const matches = [];

            cards.forEach(card => {
                const name = card.getAttribute("data-name") || card.querySelector("h3")?.textContent || "";
                const price = card.getAttribute("data-price") || "";
                const img = card.querySelector("img")?.getAttribute("src") || "picture/logo.png";
                if (name.toLowerCase().includes(query)) {
                    matches.push({ name, price, img });
                }
            });

            if (matches.length === 0) {
                searchResultsContainer.innerHTML = `<p class="text-xs text-center font-bold text-rose-400 py-8">عفواً، لم نجد أي قطع مطابقة لـ "${query}"</p>`;
            } else {
                searchResultsContainer.innerHTML = matches.map(item => `
                    <div class="flex items-center justify-between p-3 rounded-xl bg-[#111922] border border-[rgba(0,163,196,0.2)] hover:border-[#00E5FF] transition-all cursor-pointer search-result-item" data-name="${item.name}">
                        <div class="flex items-center gap-3">
                            <img src="${item.img}" alt="${item.name}" class="w-12 h-12 object-contain rounded-lg bg-[#0a0f14] p-1 border border-white/5">
                            <div>
                                <h4 class="text-xs font-bold text-white mb-0.5">${item.name}</h4>
                                <span class="text-xs font-mono text-[#C5A059] font-bold">${item.price ? Number(item.price).toLocaleString("ar-IQ") + " د.ع" : "اتصل بالسعر"}</span>
                            </div>
                        </div>
                        <button type="button" class="mesora-btn px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1">
                            <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                            إضافة للسلة
                        </button>
                    </div>
                `).join("");
                if (typeof lucide !== "undefined") lucide.createIcons();
            }
        });
    }

    // ==========================================================================
    // Interactive PC Builder Configurator Engine
    // ==========================================================================
    const initPCBuilder = () => {
        const builderComponents = document.getElementById("pc-builder-components");
        const summaryList = document.getElementById("builder-summary-list");
        const totalPriceEl = document.getElementById("builder-total-price");
        const addToCartBtn = document.getElementById("builder-add-to-cart");
        const sendWhatsappBtn = document.getElementById("builder-send-whatsapp");

        if (!builderComponents || !summaryList) return;

        const cpuSpecs = {
            "Intel Core i5-13400F": { socket: "LGA1700", tdp: 148 },
            "Intel Core i7-13700K": { socket: "LGA1700", tdp: 253 },
            "AMD Ryzen 5 7600X": { socket: "AM5", tdp: 142 },
            "AMD Ryzen 7 7800X3D": { socket: "AM5", tdp: 162 }
        };

        const motherboardSpecs = {
            "ASUS Prime B760-PLUS DDR5": { socket: "LGA1700" },
            "MSI MAG Z790 Tomahawk WiFi": { socket: "LGA1700" },
            "ASUS TUF B650-PLUS (AM5)": { socket: "AM5" },
            "ROG Strix X670E-E Gaming": { socket: "AM5" }
        };

        const gpuSpecs = {
            "NVIDIA RTX 4060 8GB": { tdp: 115 },
            "NVIDIA RTX 4070 Super 12GB": { tdp: 220 },
            "RX 7800 XT 16GB": { tdp: 263 },
            "NVIDIA RTX 4080 Super 16GB": { tdp: 320 }
        };

        const psuSpecs = {
            "650W DeepCool 80+ Bronze": { capacity: 650 },
            "750W Corsair RM750e 80+ Gold": { capacity: 750 },
            "1000W Seasonic Vertex 80+ Gold": { capacity: 1000 }
        };

        const getGroupLabel = (select) => {
            const group = select.closest(".builder-group");
            if (!group) return "قطعة";
            const label = group.querySelector("label span");
            if (!label) return "قطعة";
            const text = label.textContent || "";
            const match = text.match(/\d+\.\s*(.+)/);
            return match ? match[1].trim() : text.trim() || "قطعة";
        };

        const calculateBuild = () => {
            const selects = builderComponents.querySelectorAll("select.builder-select");
            let total = 0;
            const items = [];

            selects.forEach(select => {
                const selectedOption = select.options[select.selectedIndex];
                if (!selectedOption) return;
                const name = selectedOption.value;
                // Skip if empty placeholder option
                if (!name) return;
                const price = Number(selectedOption.getAttribute("data-price")) || 0;
                const groupLabel = getGroupLabel(select);
                total += price;
                items.push({ groupLabel, name, price });
            });

            if (items.length === 0) {
                summaryList.innerHTML = `
                    <div class="text-center py-6 border border-dashed border-[rgba(197,160,89,0.3)] rounded-xl bg-[#111922]">
                        <span class="block text-[#8A9AAD] text-xs font-medium mb-1">👈 اختر قطعك من القوائم أعلاه</span>
                        <span class="block text-[10px] text-[#8A9AAD]/70">سيظهر السعر الإجمالي هنا تلقائياً</span>
                    </div>
                `;
            } else {
                summaryList.innerHTML = items.map(item => `
                    <div class="flex items-center justify-between p-2 rounded-lg bg-[#111922] border border-white/5">
                        <div class="min-w-0 pr-2">
                            <span class="block text-[10px] text-[#8A9AAD]">${item.groupLabel}</span>
                            <span class="block font-bold text-white truncate text-[11px]">${item.name}</span>
                        </div>
                        <span class="font-mono text-[#C5A059] font-bold text-[11px] shrink-0">${item.price.toLocaleString("ar-IQ")} د.ع</span>
                    </div>
                `).join("");
            }

            if (totalPriceEl) {
                totalPriceEl.textContent = `${total.toLocaleString("ar-IQ")} د.ع`;
            }

            // Get selected CPU, GPU, Motherboard, PSU
            const cpuVal = builderComponents.querySelector('select[name="builder-cpu"]')?.value;
            const moboVal = builderComponents.querySelector('select[name="builder-motherboard"]')?.value;
            const gpuVal = builderComponents.querySelector('select[name="builder-gpu"]')?.value;
            const psuVal = builderComponents.querySelector('select[name="builder-psu"]')?.value;

            const compatBox = document.getElementById("builder-compatibility-box");
            const compatStatusEl = document.getElementById("builder-compat-status");
            const totalWattsEl = document.getElementById("builder-total-watts");
            const psuStatusEl = document.getElementById("builder-psu-status");
            const compatMsgEl = document.getElementById("builder-compat-msg");

            if (compatBox) {
                if (!cpuVal && !moboVal && !gpuVal && !psuVal) {
                    compatBox.classList.add("hidden");
                } else {
                    compatBox.classList.remove("hidden");

                    let totalWatts = 80; // Base load for RAM, SSD, fans, motherboard
                    let cpuSocket = null;
                    let moboSocket = null;
                    let isSocketCompatible = true;
                    let psuCapacity = 0;

                    if (cpuVal && cpuSpecs[cpuVal]) {
                        totalWatts += cpuSpecs[cpuVal].tdp;
                        cpuSocket = cpuSpecs[cpuVal].socket;
                    }
                    if (gpuVal && gpuSpecs[gpuVal]) {
                        totalWatts += gpuSpecs[gpuVal].tdp;
                    }
                    if (moboVal && motherboardSpecs[moboVal]) {
                        moboSocket = motherboardSpecs[moboVal].socket;
                    }
                    if (psuVal && psuSpecs[psuVal]) {
                        psuCapacity = psuSpecs[psuVal].capacity;
                    }

                    // Check socket compatibility
                    if (cpuSocket && moboSocket) {
                        isSocketCompatible = (cpuSocket === moboSocket);
                    }

                    // Update Watts display
                    if (totalWattsEl) {
                        totalWattsEl.textContent = `${totalWatts} واط`;
                    }

                    // Update PSU Status
                    if (psuStatusEl) {
                        if (psuCapacity > 0) {
                            psuStatusEl.textContent = `${psuCapacity} واط`;
                            if (psuCapacity < totalWatts) {
                                psuStatusEl.className = "font-bold text-rose-500 font-mono";
                            } else if (psuCapacity < totalWatts + 100) {
                                psuStatusEl.className = "font-bold text-amber-500 font-mono";
                            } else {
                                psuStatusEl.className = "font-bold text-emerald-400 font-mono";
                            }
                        } else {
                            psuStatusEl.textContent = "لم يتم الاختيار";
                            psuStatusEl.className = "font-bold text-[#8A9AAD]";
                        }
                    }

                    // Determine final status
                    let statusHtml = "";
                    let msg = "";
                    
                    if (cpuSocket && moboSocket && !isSocketCompatible) {
                        statusHtml = `<span class="text-rose-500 flex items-center gap-1"><i data-lucide="x-circle" class="w-4 h-4"></i> غير متوافق</span>`;
                        msg = `❌ المعالج المختار يعمل بمقبس <strong>${cpuSocket}</strong> بينما اللوحة الأم تدعم مقبس <strong>${moboSocket}</strong>. يرجى تعديل الاختيار لتجنب مشاكل التركيب الفني.`;
                        compatBox.style.borderColor = "rgba(239, 68, 68, 0.4)";
                    } else {
                        // Check PSU sufficiency
                        if (psuCapacity > 0) {
                            if (psuCapacity < totalWatts) {
                                statusHtml = `<span class="text-rose-500 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-4 h-4"></i> مزود طاقة ضعيف</span>`;
                                msg = `⚠️ قدرة الباورسبلاي المختار (${psuCapacity}W) غير كافية لإجمالي استهلاك القطع المقدر بـ (${totalWatts}W). يرجى ترقيته إلى مزود أعلى لتجنب تلف القطع أو عدم الاستقرار.`;
                                compatBox.style.borderColor = "rgba(239, 68, 68, 0.4)";
                            } else if (psuCapacity < totalWatts + 100) {
                                statusHtml = `<span class="text-amber-500 flex items-center gap-1"><i data-lucide="alert-circle" class="w-4 h-4"></i> طاقة قريبة للحد</span>`;
                                msg = `⚡ التجميعة متوافقة، ولكن مزود الطاقة المختار (${psuCapacity}W) قريب جداً من استهلاك قطعك الكلي (${totalWatts}W). ننصح بترقيته لمزيد من الأمان ومستقبل الترقية.`;
                                compatBox.style.borderColor = "rgba(245, 158, 11, 0.4)";
                            } else {
                                statusHtml = `<span class="text-emerald-400 flex items-center gap-1"><i data-lucide="check-circle" class="w-4 h-4"></i> متوافق تماماً</span>`;
                                msg = `✅ جميع القطع متوافقة تماماً وممتازة! استهلاك الطاقة المقدر (${totalWatts}W) يقع ضمن النطاق الآمن والمستقر مع مزود الطاقة المختار (${psuCapacity}W).`;
                                compatBox.style.borderColor = "rgba(16, 185, 129, 0.4)";
                            }
                        } else {
                            statusHtml = `<span class="text-[#00E5FF] flex items-center gap-1"><i data-lucide="info" class="w-4 h-4"></i> بانتظار القطع</span>`;
                            msg = `ℹ️ يرجى إكمال اختيار المعالج، اللوحة الأم، ومزود الطاقة لإظهار تقرير التوافق والقدرة الكهربائية الشامل.`;
                            compatBox.style.borderColor = "rgba(0, 229, 255, 0.25)";
                        }
                    }

                    if (compatStatusEl) compatStatusEl.innerHTML = statusHtml;
                    if (compatMsgEl) compatMsgEl.innerHTML = msg;
                    if (typeof lucide !== "undefined") lucide.createIcons();
                }
            }

            return { items, total };
        };

        calculateBuild();

        builderComponents.addEventListener("change", (e) => {
            if (e.target.matches("select.builder-select")) {
                calculateBuild();
            }
        });

        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", () => {
                const { items, total } = calculateBuild();
                if (items.length === 0) {
                    showToast("⚠️ اختر قطعة واحدة على الأقل قبل إضافة التجميعة");
                    return;
                }
                const buildName = `تجميعة PC خاصة (${items.map(i => i.name.split(" ")[0]).join(" + ")})`;
                addToCart({
                    name: buildName,
                    price: total,
                    img: "picture/logo.png"
                });
                openCartDrawer();
            });
        }

        if (sendWhatsappBtn) {
            sendWhatsappBtn.addEventListener("click", () => {
                const { items, total } = calculateBuild();
                if (items.length === 0) {
                    showToast("⚠️ اختر قطعة واحدة على الأقل قبل إرسال الطلب");
                    return;
                }
                const itemsText = items.map((item, idx) => `${idx + 1}. *${item.groupLabel}*: ${item.name} (${item.price.toLocaleString("ar-IQ")} د.ع)`).join("\n");
                
                const messageLines = [
                    "🖥️ *طلب تجميعة PC جديدة من متجر MESORA*",
                    "--------------------------------",
                    itemsText,
                    "--------------------------------",
                    `💰 *المجموع التقديري للتجميعة*: ${total.toLocaleString("ar-IQ")} د.ع`,
                    "--------------------------------",
                    "يرجى تأكيد التوفر والتواصل لإتمام الشراء والتوصيل."
                ];

                const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageLines.join("\n"))}`;
                window.open(url, "_blank");
            });
        }
    };

    initPCBuilder();

    // ==========================================================================
    // Quick View Product Modal Controller Engine
    // ==========================================================================
    const qvOverlay = document.getElementById("quick-view-overlay");
    const qvModal = document.getElementById("quick-view-modal");
    const qvClose = document.getElementById("quick-view-close");
    const qvImg = document.getElementById("qv-img");
    const qvTitle = document.getElementById("qv-title");
    const qvCategory = document.getElementById("qv-category");
    const qvPrice = document.getElementById("qv-price");
    const qvBadge = document.getElementById("qv-badge");
    const qvAddToCartBtn = document.getElementById("qv-add-to-cart");
    const qvOrderWhatsappBtn = document.getElementById("qv-order-whatsapp");

    let currentQVProduct = null;

    const openQuickView = (productData) => {
        if (!qvModal || !qvOverlay) return;
        currentQVProduct = productData;

        if (qvImg) qvImg.src = productData.img || "picture/logo.png";
        if (qvTitle) qvTitle.textContent = productData.name || "منتج ميسورا";
        if (qvCategory) qvCategory.textContent = productData.categoryName || "مكونات وأجهزة احترافية";
        if (qvPrice) qvPrice.textContent = productData.price ? `${Number(productData.price).toLocaleString("ar-IQ")} د.ع` : "السعر عند التواصل";
        if (qvBadge) qvBadge.textContent = productData.stock === "low" ? "آخر قطعة" : "متوفر أصلي";

        qvOverlay.classList.remove("opacity-0", "pointer-events-none");
        qvModal.classList.remove("opacity-0", "pointer-events-none", "scale-95");
        qvModal.classList.add("scale-100");
        document.body.style.overflow = "hidden";
    };

    const closeQuickView = () => {
        if (!qvModal || !qvOverlay) return;
        qvOverlay.classList.add("opacity-0", "pointer-events-none");
        qvModal.classList.add("opacity-0", "pointer-events-none", "scale-95");
        qvModal.classList.remove("scale-100");
        document.body.style.overflow = "";
    };

    if (qvClose) qvClose.addEventListener("click", closeQuickView);
    if (qvOverlay) qvOverlay.addEventListener("click", closeQuickView);

    if (qvAddToCartBtn) {
        qvAddToCartBtn.addEventListener("click", () => {
            if (currentQVProduct) {
                addToCart(currentQVProduct);
                closeQuickView();
                openCartDrawer();
            }
        });
    }

    if (qvOrderWhatsappBtn) {
        qvOrderWhatsappBtn.addEventListener("click", () => {
            if (currentQVProduct) {
                const message = `مرحباً متجر MESORA 👋\nأرغب في الاستفسار وطلب قطعة: *${currentQVProduct.name}*\nالسعر: ${currentQVProduct.price ? Number(currentQVProduct.price).toLocaleString("ar-IQ") + " د.ع" : ""}`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
            }
        });
    }

    // Global listener for Quick View button clicks
    document.addEventListener("click", (e) => {
        const qvBtn = e.target.closest(".mesora-quick-view-btn");
        if (qvBtn) {
            e.preventDefault();
            const card = qvBtn.closest(".mesora-product-card");
            if (card) {
                const name = card.getAttribute("data-name") || card.querySelector("h3")?.textContent;
                const price = card.getAttribute("data-price") || 0;
                const img = card.querySelector("img")?.getAttribute("src") || "picture/logo.png";
                const category = card.getAttribute("data-category") || "قطع ومكونات";
                const stock = card.getAttribute("data-stock") || "available";
                
                const categoryNames = {
                    gpu: "كروت الشاشة",
                    cpu: "المعالجات",
                    accessories: "الملحقات والإكسسوارات",
                    audio: "السماعات والصوتيات",
                    motherboard: "اللوحات الأم",
                    storage: "التخزين والذاكرة"
                };

                openQuickView({
                    name,
                    price,
                    img,
                    categoryName: categoryNames[category] || category,
                    stock
                });
            }
        }
    });

    // Note: Swiper slider removed — replaced with static gallery grid
    // (initProductSwiper function removed for performance)

    const header = document.querySelector("#main-header");
    let scrollRaf = 0;
    const onScrollFrame = () => {
        scrollRaf = 0;
        if (header) {
            if (window.scrollY > 20) {
                header.style.background = "rgba(10, 15, 20, 0.97)";
                header.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.5)";
            } else {
                header.style.background = "rgba(10, 15, 20, 0.92)";
                header.style.boxShadow = "none";
            }
        }
        setActiveNav();
        animateStats();
    };
    window.addEventListener("scroll", () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(onScrollFrame);
    }, { passive: true });

    const menuToggle = document.querySelector("#menu-toggle");
    const mobileNav = document.querySelector("#mobile-nav");

    const closeMobileNav = () => {
        if (!menuToggle || !mobileNav) return;
        mobileNav.classList.remove("open");
        mobileNav.setAttribute("aria-hidden", "true");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "فتح القائمة");
        menuToggle.innerHTML = '<i data-lucide="menu"></i>';
        if (typeof lucide !== "undefined") lucide.createIcons();
    };

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener("click", () => {
            const isOpen = mobileNav.classList.toggle("open");
            mobileNav.setAttribute("aria-hidden", String(!isOpen));
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
            menuToggle.innerHTML = isOpen
                ? '<i data-lucide="x"></i>'
                : '<i data-lucide="menu"></i>';
            if (typeof lucide !== "undefined") lucide.createIcons();
        });

        mobileNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMobileNav);
        });
    }

    const navLinks = document.querySelectorAll(".mesora-nav-link[data-section]");
    const sections = document.querySelectorAll("section[id]");
    const navSectionIds = new Set(
        Array.from(navLinks).map((link) => link.dataset.section).filter(Boolean)
    );

    const setActiveNav = () => {
        let current = "home";
        sections.forEach((section) => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.id;
            }
        });
        if (current === "products") current = "featured";
        if (!navSectionIds.has(current)) {
            const fallback = Array.from(navSectionIds).find((id) => {
                const el = document.getElementById(id);
                return el && window.scrollY >= el.offsetTop - 120;
            });
            if (fallback) current = fallback;
        }
        navLinks.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === current);
        });
    };

    setActiveNav();

    // animateStats removed - section was deleted
    const animateStats = () => {};
    animateStats();

    // Show all reveal elements immediately on page load to prevent scattered layout
    document.querySelectorAll(".mesora-reveal").forEach((el) => {
        el.classList.add("is-visible");
    });

    // ==========================================================================
    // Feature 8: Product Ratings & Reviews Display
    // ==========================================================================

    // Add star ratings to product cards
    productCards.forEach(card => {
        const rating = parseFloat(card.dataset.rating) || 0;
        const reviews = card.dataset.reviews || 0;
        if (rating > 0) {
            const ratingEl = document.createElement("div");
            ratingEl.className = "mesora-product-rating flex items-center gap-1.5 mb-2";
            
            const stars = Math.round(rating);
            let starsHTML = "";
            for (let i = 1; i <= 5; i++) {
                starsHTML += i <= stars 
                    ? '<span class="text-[#C5A059] text-xs">★</span>' 
                    : '<span class="text-[#3a4250] text-xs">★</span>';
            }
            
            ratingEl.innerHTML = `
                <span class="flex items-center gap-0.5 text-sm">${starsHTML}</span>
                <span class="text-[10px] text-[#8A9AAD] font-medium">${rating.toFixed(1)}</span>
                <span class="text-[10px] text-[#8A9AAD]/60">(${reviews} تقييم)</span>
            `;
            
            const body = card.querySelector(".mesora-product-body");
            if (body) {
                const desc = body.querySelector("p");
                if (desc) {
                    desc.insertAdjacentElement("afterend", ratingEl);
                } else {
                    body.prepend(ratingEl);
                }
            }
        }
    });

    // ==========================================================================
    // Feature 9: Price Filter Engine
    // ==========================================================================
    const priceFilterBtns = document.querySelectorAll(".mesora-price-filter-btn");
    
    const filterProductsByPrice = (filterValue) => {
        let visible = 0;
        productCards.forEach(card => {
            const price = Number(card.dataset.price) || 0;
            let match = true;
            
            if (filterValue === "budget") {
                match = price < 100000;
            } else if (filterValue === "mid") {
                match = price >= 100000 && price <= 300000;
            } else if (filterValue === "premium") {
                match = price > 300000;
            }
            
            card.classList.toggle("is-hidden", !match);
            if (match) visible++;
        });
        
        // Update active button styles
        priceFilterBtns.forEach(btn => {
            const isActive = btn.dataset.priceFilter === filterValue;
            btn.classList.toggle("active", isActive);
            if (isActive) {
                btn.classList.remove("text-[#8A9AAD]", "bg-[#0d151e]");
                btn.classList.add("text-[#00E5FF]", "bg-[#0d151e]", "border-[rgba(0,163,196,0.35)]");
            } else {
                btn.classList.remove("text-[#00E5FF]", "border-[rgba(0,163,196,0.35)]");
                btn.classList.add("text-[#8A9AAD]", "border-[rgba(0,163,196,0.25)]");
            }
        });
        
        if (filterNote) {
            if (visible === 0) {
                filterNote.hidden = false;
                filterNote.textContent = "لا توجد منتجات ضمن هذا النطاق السعري حالياً";
            } else {
                filterNote.hidden = true;
            }
        }
    };
    
    priceFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterProductsByPrice(btn.dataset.priceFilter);
        });
    });
    const categoryLabels = {
        cpu: "معالجات",
        gpu: "كروت شاشة",
        ram: "ذاكرة RAM",
        storage: "تخزين",
        monitor: "شاشات",
        case: "كيسات",
        cooling: "مبردات",
        motherboard: "لوحات أم",
        accessories: "ملحقات",
        audio: "سماعات",
    };

    const clearProductFilter = () => {
        productCards.forEach((card) => {
            card.classList.remove("is-hidden", "is-highlight");
        });
        if (filterNote) {
            filterNote.hidden = true;
            filterNote.textContent = "";
        }
    };

    const filterProductsByCategory = (category) => {
        if (!category) {
            clearProductFilter();
            return;
        }

        let visible = 0;
        productCards.forEach((card) => {
            const match = card.dataset.category === category;
            card.classList.toggle("is-hidden", !match);
            card.classList.toggle("is-highlight", match);
            if (match) visible += 1;
        });

        if (filterNote) {
            if (visible === 0) {
                clearProductFilter();
                filterNote.hidden = false;
                filterNote.textContent = `لا توجد منتجات معروضة حالياً ضمن «${categoryLabels[category] || category}». تواصل معنا للطلب.`;
            } else {
                filterNote.hidden = false;
                filterNote.textContent = `عرض فئة: ${categoryLabels[category] || category}`;
            }
        }
    };

    const filterProductsByQuery = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) {
            clearProductFilter();
            return 0;
        }

        let visible = 0;
        productCards.forEach((card) => {
            const haystack = `${card.dataset.name || ""} ${card.dataset.category || ""}`.toLowerCase();
            const match = haystack.includes(q);
            card.classList.toggle("is-hidden", !match);
            card.classList.toggle("is-highlight", match);
            if (match) visible += 1;
        });

        if (filterNote) {
            filterNote.hidden = false;
            filterNote.textContent = visible
                ? `نتائج البحث عن «${query.trim()}»`
                : `لا توجد نتائج لـ «${query.trim()}»`;
        }
        return visible;
    };

    document.querySelectorAll("[data-category]").forEach((el) => {
        if (!el.matches("a.mesora-category-card, .mesora-footer-links a")) return;
        el.addEventListener("click", () => {
            const category = el.dataset.category;
            filterProductsByCategory(category);
        });
    });

    // ==========================================================================
    // Feature: Orbital Moons (Categories) Click Handler
    // ==========================================================================
    document.querySelectorAll(".orbital-moon[data-category]").forEach((moon) => {
        moon.addEventListener("click", () => {
            const category = moon.dataset.category;
            filterProductsByCategory(category);
            const featured = document.getElementById("featured");
            if (featured) {
                featured.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
            }
            const catName = moon.querySelector(".moon-name")?.textContent || category;
            showToast(`تم اختيار فئة: ${catName}`);
        });
    });

    const handleSearchSubmit = (e, inputEl) => {
        e.preventDefault();
        if (!inputEl) return;
        const count = filterProductsByQuery(inputEl.value);
        const featured = document.querySelector("#featured");
        if (featured) {
            featured.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
        }
        showToast(count ? `تم العثور على ${count} منتج` : "لا توجد نتائج — جرّب كلمة أخرى أو تواصل معنا");
    };

    const searchForm = document.querySelector("#search-form");
    const searchInput = document.querySelector("#site-search");
    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", (e) => {
            handleSearchSubmit(e, searchInput);
        });
    }

    const mobileSearchForm = document.querySelector("#mobile-search-form");
    const mobileSearchInput = document.querySelector("#mobile-site-search");
    if (mobileSearchForm && mobileSearchInput) {
        mobileSearchForm.addEventListener("submit", (e) => {
            closeMobileNav();
            handleSearchSubmit(e, mobileSearchInput);
        });
    }

    document.querySelectorAll(".mesora-order-whatsapp").forEach((link) => {
        const product = link.dataset.product || "منتج";
        const price = link.dataset.price || "";
        const stock = link.dataset.stock || "available";

        link.href = buildWhatsAppOrderUrl(product, price, stock);
        link.setAttribute(
            "aria-label",
            stock === "out"
                ? `الاستفسار عن توفر ${product} عبر واتساب`
                : `اطلب ${product} عبر واتساب`
        );

        if (stock === "out") {
            link.classList.add("is-out");
            link.innerHTML = '<i data-lucide="message-circle" aria-hidden="true"></i> اطلب عند التوفر';
        }
    });
    lucide.createIcons();

    document.querySelectorAll(".mesora-product-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".mesora-product-card");
            const product = btn.dataset.product || card?.dataset.name || "منتج";
            const price = card?.dataset.price || "";
            const stock = card?.dataset.stock || "available";
            const subject = document.querySelector("#subject");
            const message = document.querySelector("#message");
            if (subject) subject.value = "طلب قطعة";
            if (message) {
                const priceText = price
                    ? `\nالسعر المعروض: ${Number(price).toLocaleString("ar-IQ")} د.ع`
                    : "";
                const stockText = STOCK_LABELS[stock]
                    ? `\nالحالة: ${STOCK_LABELS[stock]}`
                    : "";
                message.value = `أرغب بطلب: ${product}${priceText}${stockText}`;
            }
            const contact = document.querySelector("#contact");
            if (contact) {
                contact.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
            }
            showToast(`تم تجهيز طلب «${product}» — أكمل النموذج للتواصل`);
            if (message) message.focus();
        });
    });

    const contactForm = document.querySelector("#contact-form");
    const formSuccess = document.querySelector("#form-success");
    const formError = document.querySelector("#form-error");

    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (formError) formError.classList.add("hidden");
            if (formSuccess) formSuccess.classList.add("hidden");

            if (!contactForm.checkValidity()) {
                if (formError) formError.classList.remove("hidden");
                contactForm.reportValidity();
                return;
            }

            const data = new FormData(contactForm);
            const name = String(data.get("name") || "").trim();
            const phone = String(data.get("phone") || "").trim();
            const subject = String(data.get("subject") || "استفسار");
            const message = String(data.get("message") || "").trim();
            const body = [
                `الاسم: ${name}`,
                `الهاتف: ${phone}`,
                "",
                message,
            ].join("\n");

            const mailto = `mailto:aliahmed.nkk5@gmail.com,aliahmed.nkk6@gmail.com?subject=${encodeURIComponent(`MESORA — ${subject}`)}&body=${encodeURIComponent(body)}`;
            if (formSuccess) formSuccess.classList.remove("hidden");
            showToast("سيتم فتح تطبيق البريد لإرسال الرسالة");
            window.location.href = mailto;
        });
    }

    // Brand Marquee filter removed - section was deleted
    const marqueeSlides = [];
    // ==========================================================================
    // Feature 2 (Removed - Stats deleted)
    // ==========================================================================

    // ==========================================================================
    // Feature 3: FAQ Live Search Engine Filter
    // ==========================================================================
    const faqSearchInput = document.getElementById("faq-search-input");
    const faqItems = document.querySelectorAll(".mesora-faq-item");

    if (faqSearchInput && faqItems.length > 0) {
        faqSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            faqItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = "";
                    if (query.length > 1) item.open = true;
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    // ==========================================================================
    // Feature 4: Scroll Progress Ring & Back-to-Top Button
    // ==========================================================================
    const backToTopBtn = document.getElementById("back-to-top");
    const progressBar = document.getElementById("scroll-progress-bar");
    const topProgressBar = document.getElementById("scroll-progress");

    const handleScrollProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if (scrollHeight > 0 && progressBar) {
            const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
            progressBar.setAttribute("stroke-dasharray", `${progress}, 100`);
        }

        if (topProgressBar) {
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            topProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        if (backToTopBtn) {
            if (scrollTop > 300) {
                backToTopBtn.classList.remove("opacity-0", "pointer-events-none");
            } else {
                backToTopBtn.classList.add("opacity-0", "pointer-events-none");
            }
        }
    };

    window.addEventListener("scroll", handleScrollProgress, { passive: true });
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
        });
    }

    // ==========================================================================
    // Feature 5: Cyber Neon Color Switcher Engine
    // ==========================================================================
    // Theme color picker buttons in the top ticker
    const themePickers = document.querySelectorAll("[data-theme-color]");
    
    // Theme color definitions with teal and glow values
    const themeColors = {
        cyan: { teal: "#00E5FF", glow: "rgba(0, 229, 255, 0.35)" },
        violet: { teal: "#A855F7", glow: "rgba(168, 85, 247, 0.35)" },
        emerald: { teal: "#10B981", glow: "rgba(16, 185, 129, 0.35)" },
        gold: { teal: "#F59E0B", glow: "rgba(245, 158, 11, 0.35)" }
    };

    /**
     * Apply selected theme color to ALL site elements (buttons, effects, borders, backgrounds, text, etc.)
     * @param {string} colorKey - The theme color key (cyan, violet, emerald, gold)
     */
    const applyThemeColor = (colorKey) => {
        const theme = themeColors[colorKey] || themeColors.cyan;
        const teal = theme.teal;
        const glow = theme.glow;
        
        // ============================================================
        // 1. Update CSS custom properties for global theming
        // ============================================================
        document.documentElement.style.setProperty("--mesora-teal", teal);
        document.documentElement.style.setProperty("--mesora-teal-light", teal);
        document.documentElement.style.setProperty("--mesora-teal-glow", glow);
        document.documentElement.style.setProperty("--theme-primary", teal);
        document.documentElement.style.setProperty("--theme-glow", glow);
        
        // ============================================================
        // 2. Update CPU cursor icon color dynamically
        // ============================================================
        const cpuCursor = document.getElementById("mesora-cursor-cpu");
        if (cpuCursor) {
            const svg = cpuCursor.querySelector("svg");
            if (svg) {
                const strokes = svg.querySelectorAll("rect[stroke], circle[fill], path[stroke]");
                strokes.forEach(el => {
                    if (el.tagName === "rect" && el.getAttribute("stroke")) {
                        el.setAttribute("stroke", teal);
                    } else if (el.tagName === "circle" && el.getAttribute("fill") === "#00E5FF") {
                        el.setAttribute("fill", teal);
                    }
                });
                const gradient = svg.querySelector("linearGradient");
                if (gradient) {
                    const stops = gradient.querySelectorAll("stop");
                    if (stops.length >= 3) {
                        stops[0].setAttribute("stop-color", teal);
                        stops[1].setAttribute("stop-color", teal);
                        stops[2].setAttribute("stop-color", "#C5A059");
                    }
                }
            }
            cpuCursor.style.filter = `drop-shadow(0 0 10px ${teal}) drop-shadow(0 0 20px rgba(197, 160, 89, 0.75))`;
        }
        
        // ============================================================
        // 3. Update global mouse glow effect
        // ============================================================
        const mouseGlow = document.getElementById("mesora-global-glow");
        if (mouseGlow) {
            mouseGlow.style.background = `radial-gradient(circle, ${glow} 0%, rgba(197, 160, 89, 0.15) 30%, ${glow.replace('0.35', '0.05')} 55%, transparent 70%)`;
        }
        
        // ============================================================
        // 4. Update ALL buttons and interactive elements across the site
        // ============================================================
        
        // Primary buttons - update gradient and hover
        document.querySelectorAll('.mesora-btn-primary').forEach(btn => {
            btn.style.background = `linear-gradient(135deg, ${teal}, ${teal}CC)`;
            btn.style.borderColor = teal;
            btn.style.boxShadow = `0 6px 20px ${glow}`;
        });
        
        // Secondary buttons - update border and text
        document.querySelectorAll('.mesora-btn-secondary').forEach(btn => {
            btn.style.color = teal;
            btn.style.borderColor = `${teal}88`;
        });
        
        // Cart trigger button
        const cartBtn = document.getElementById('cart-toggle-btn');
        if (cartBtn) {
            cartBtn.style.background = `${teal}1F`;
            cartBtn.style.borderColor = `${teal}66`;
            cartBtn.style.color = teal;
        }
        
        // Customize theme button
        const customizeBtn = document.getElementById('customize-theme-btn');
        if (customizeBtn) {
            customizeBtn.style.color = teal;
            customizeBtn.style.borderColor = `${teal}4D`;
        }
        
        // Builder preset buttons
        document.querySelectorAll('.builder-preset-btn').forEach(btn => {
            btn.style.borderColor = `${teal}4D`;
        });
        
        // Price filter buttons
        document.querySelectorAll('.mesora-price-filter-btn').forEach(btn => {
            if (btn.classList.contains('active')) {
                btn.style.color = teal;
                btn.style.borderColor = `${teal}59`;
            }
        });
        
        // Product quick view buttons
        document.querySelectorAll('.mesora-quick-view-btn').forEach(btn => {
            btn.style.background = `${teal}1F`;
            btn.style.borderColor = `${teal}4D`;
            btn.style.color = teal;
        });
        
        // Product add-to-cart buttons
        document.querySelectorAll('.mesora-product-btn').forEach(btn => {
            btn.style.background = `${teal}1A`;
            btn.style.borderColor = `${teal}73`;
            btn.style.color = teal;
        });
        
        // Compare buttons
        document.querySelectorAll('.mesora-compare-trigger').forEach(btn => {
            btn.style.color = teal;
            btn.style.borderColor = `${teal}4D`;
        });
        
        // Review preview buttons
        document.querySelectorAll('.review-preview-btn').forEach(btn => {
            btn.style.color = teal;
            btn.style.borderColor = `${teal}66`;
            btn.style.background = `${teal}14`;
        });
        
        // Back to top button
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            backToTop.style.color = teal;
            backToTop.style.borderColor = `${teal}66`;
        }
        
        // Spin wheel trigger
        const spinTrigger = document.getElementById('spin-wheel-trigger');
        if (spinTrigger) {
            spinTrigger.style.borderColor = `${teal}80`;
            spinTrigger.style.color = teal;
            spinTrigger.style.boxShadow = `0 0 15px ${glow}`;
        }
        
        // ============================================================
        // 5. Update text accents and highlights
        // ============================================================
        document.querySelectorAll('.mesora-hero-accent').forEach(el => {
            el.style.color = teal;
            el.style.textShadow = `0 0 32px ${glow}`;
        });
        
        document.querySelectorAll('.mesora-section-kicker').forEach(el => {
            el.style.color = teal;
        });
        
        document.querySelectorAll('.mesora-kicker').forEach(el => {
            el.style.color = teal;
            el.style.borderColor = `${teal}59`;
            el.style.background = `${teal}14`;
        });
        
        // ============================================================
        // 6. Update borders, cards, and containers
        // ============================================================
        document.querySelectorAll('.mesora-card, .mesora-product-card, .mesora-category-card, .mesora-step-card, .mesora-testimonial, .mesora-faq-item, .mesora-contact-form, .mesora-guarantee-box').forEach(card => {
            card.style.borderColor = `${teal}38`;
        });
        
        // Trust badges
        document.querySelectorAll('.mesora-trust-badge svg').forEach(icon => {
            icon.style.color = teal;
        });
        
        // Trust icons
        document.querySelectorAll('.hero-trust-icon-teal').forEach(icon => {
            icon.style.background = `${teal}1F`;
            icon.style.borderColor = `${teal}4D`;
            icon.style.color = teal;
        });
        
        // ============================================================
        // 7. Update logo glow ring and gradient border
        // ============================================================
        const glowRing = document.querySelector('.logo-glow-ring');
        if (glowRing) {
            glowRing.style.background = `radial-gradient(circle, ${glow} 0%, transparent 65%)`;
        }
        
        const gradientBorder = document.querySelector('.logo-gradient-border');
        if (gradientBorder) {
            gradientBorder.style.background = `linear-gradient(135deg, ${teal}, #C5A059)`;
        }
        
        const innerContainer = document.querySelector('.logo-inner-container');
        if (innerContainer) {
            innerContainer.style.borderColor = `${teal}59`;
            innerContainer.style.boxShadow = `0 10px 30px rgba(0,0,0,0.4), 0 0 20px ${glow}`;
        }
        
        // ============================================================
        // 8. Update scroll progress bar
        // ============================================================
        const scrollProgress = document.getElementById('scroll-progress');
        if (scrollProgress) {
            scrollProgress.style.background = `linear-gradient(to right, ${teal}, #C5A059)`;
        }
        
        const scrollProgressBar = document.getElementById('scroll-progress-bar');
        if (scrollProgressBar) {
            scrollProgressBar.style.stroke = teal;
        }
        
        // ============================================================
        // 9. Update live preview panel in customizer
        // ============================================================
        const preview = document.getElementById('live-preview-panel');
        if (preview) {
            // Update accent elements
            const accentEls = preview.querySelectorAll('.preview-accent, .preview-kicker, .preview-btn-secondary, .preview-card i, .preview-logo-ring');
            accentEls.forEach(el => {
                el.style.color = teal;
            });
            
            // Update kicker background
            const kickerEl = preview.querySelector('.preview-kicker');
            if (kickerEl) {
                kickerEl.style.background = `${teal}1A`;
                kickerEl.style.borderColor = `${teal}4D`;
            }
            
            // Update logo ring border
            const logoRing = preview.querySelector('.preview-logo-ring');
            if (logoRing) {
                logoRing.style.borderColor = teal;
            }
            
            // Update card icons
            const cardIcons = preview.querySelectorAll('.preview-card i');
            cardIcons.forEach(icon => {
                icon.style.color = teal;
            });
            
            // Update cursor preview glow
            const cursorPreview = document.getElementById('cursor-preview-shape');
            if (cursorPreview) {
                cursorPreview.style.filter = `drop-shadow(0 0 8px ${glow})`;
            }
        }
        
        // ============================================================
        // 10. Update customizer modal border
        // ============================================================
        const customizeModal = document.getElementById('customize-theme-modal');
        if (customizeModal) {
            customizeModal.style.borderColor = `${teal}59`;
        }
        
        // ============================================================
        // 11. Update all SVG icons with data-lucide that use theme color
        // ============================================================
        document.querySelectorAll('i[data-lucide]').forEach(icon => {
            if (icon.classList.contains('text-[#00E5FF]')) {
                icon.style.color = teal;
            }
        });
        
        // ============================================================
        // 12. Update header border
        // ============================================================
        const header = document.getElementById('main-header');
        if (header) {
            header.style.borderBottomColor = `${teal}38`;
        }
        
        // ============================================================
        // 13. Update top ticker border
        // ============================================================
        const topTicker = document.querySelector('.mesora-top-ticker');
        if (topTicker) {
            topTicker.style.borderBottomColor = `${teal}33`;
        }
        
        // ============================================================
        // 14. Update footer PCB lines
        // ============================================================
        document.querySelectorAll('.mesora-footer-pcb path').forEach(path => {
            path.style.stroke = teal;
        });
        
        // ============================================================
        // 15. Update category filter buttons
        // ============================================================
        document.querySelectorAll('.mesora-category-filter-btn.active').forEach(btn => {
            btn.style.background = `linear-gradient(135deg, ${teal}33, ${teal}1A)`;
            btn.style.borderColor = teal;
            btn.style.color = teal;
        });
        
        // ============================================================
        // 16. Update builder group borders
        // ============================================================
        document.querySelectorAll('.builder-group').forEach(group => {
            group.style.borderColor = `${teal}40`;
        });
        
        // ============================================================
        // 17. Update cart drawer border
        // ============================================================
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer) {
            cartDrawer.style.borderLeftColor = `${teal}4D`;
        }
        
        // ============================================================
        // 18. Update modal borders
        // ============================================================
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            if (modal.id !== 'customize-theme-modal') {
                modal.style.borderColor = `${teal}59`;
            }
        });
        
        // ============================================================
        // 19. Update search input focus borders
        // ============================================================
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.style.setProperty('--focus-border', teal);
        });
        
        // Save theme preference to localStorage
        localStorage.setItem("mesora_neon_theme", colorKey);
    };

    // Apply saved theme on page load
    const savedTheme = localStorage.getItem("mesora_neon_theme");
    if (savedTheme) applyThemeColor(savedTheme);

    // Theme color picker click handlers
    themePickers.forEach(btn => {
        btn.addEventListener("click", () => {
            const colorKey = btn.getAttribute("data-theme-color");
            applyThemeColor(colorKey);
            showToast(`تم تفعيل ثيم الإضاءة النيون: ${btn.getAttribute("title") || colorKey}`);
        });
    });

    // ==========================================================================
    // Feature 6: PC Builder Presets Handler
    // ==========================================================================
    const presetButtons = document.querySelectorAll(".builder-preset-btn");
    const builderPresets = {
        budget: {
            cpu: "Intel Core i5-13400F",
            gpu: "NVIDIA RTX 4060 8GB",
            motherboard: "ASUS Prime B760-PLUS DDR5",
            ram: "16GB Corsair DDR5 5600MHz",
            storage: "1TB Kingston NVMe M.2",
            cooler: "Thermalright Air Cooler Dual Fan",
            psu: "650W DeepCool 80+ Bronze",
            case: "Gaming Mesh Case + 4 RGB Fans"
        },
        pro: {
            cpu: "Intel Core i7-13700K",
            gpu: "NVIDIA RTX 4070 Super 12GB",
            motherboard: "MSI MAG Z790 Tomahawk WiFi",
            ram: "32GB Kingston FURY DDR5 RGB",
            storage: "2TB Samsung 990 PRO Gen4",
            cooler: "DeepCool LS720 360mm Liquid",
            psu: "750W Corsair RM750e 80+ Gold",
            case: "NZXT H6 Flow Panoramic Dual-Chamber"
        },
        ultra: {
            cpu: "AMD Ryzen 7 7800X3D",
            gpu: "NVIDIA RTX 4080 Super 16GB",
            motherboard: "ROG Strix X670E-E Gaming",
            ram: "64GB G.Skill Trident Z5 RGB",
            storage: "4TB Lexar NM790 Gen4 M.2",
            cooler: "ASUS ROG Ryujin III 360 ARGB",
            psu: "1000W Seasonic Vertex 80+ Gold",
            case: "Lian Li O11 Dynamic EVO RGB"
        }
    };

    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const presetKey = btn.getAttribute("data-preset");
            const config = builderPresets[presetKey];
            if (!config) return;

            Object.entries(config).forEach(([cat, val]) => {
                const select = document.querySelector(`select[name="builder-${cat}"]`);
                if (select) {
                    // Find the option that matches the value
                    const option = Array.from(select.options).find(opt => opt.value === val);
                    if (option) {
                        select.value = val;
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }
            });

            showToast(`تم تحميل مواصفات التجميعة المختارة تلقائياً!`);
        });
    });

    if (!shouldReduceMotion) {
        document.querySelectorAll(".mesora-product-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });
    }

    // ==========================================================================
    // Feature 12: Interactive Spin the Wheel & Coupon Engine
    // ==========================================================================
    
    // 1. Coupon Input and Apply inside Cart
    const couponInput = document.getElementById("cart-coupon-input");
    const couponApplyBtn = document.getElementById("cart-coupon-apply");
    const couponMsgEl = document.getElementById("cart-coupon-message");

    if (couponApplyBtn && couponInput) {
        couponApplyBtn.addEventListener("click", () => {
            const enteredCode = couponInput.value.trim().toUpperCase();
            if (!enteredCode) {
                if (couponMsgEl) {
                    couponMsgEl.textContent = "⚠️ يرجى إدخال رمز الكوبون أولاً";
                    couponMsgEl.className = "text-[10px] mt-1.5 text-rose-400";
                    couponMsgEl.classList.remove("hidden");
                }
                return;
            }

            if (ACTIVE_COUPONS[enteredCode]) {
                appliedCoupon = enteredCode;
                updateCartUI();
                if (couponMsgEl) {
                    couponMsgEl.textContent = `✅ تم تطبيق الكوبون بنجاح: ${ACTIVE_COUPONS[enteredCode].label}`;
                    couponMsgEl.className = "text-[10px] mt-1.5 text-emerald-400 font-bold";
                    couponMsgEl.classList.remove("hidden");
                }
                showToast(`🎉 تم تطبيق خصم الكوبون: ${enteredCode}`);
            } else {
                if (couponMsgEl) {
                    couponMsgEl.textContent = "❌ رمز الكوبون غير صحيح أو منتهي الصلاحية";
                    couponMsgEl.className = "text-[10px] mt-1.5 text-rose-400";
                    couponMsgEl.classList.remove("hidden");
                }
            }
        });
    }

    // 2. Spin the Wheel Canvas and Modal Logic
    const spinOverlay = document.getElementById("spin-wheel-overlay");
    const spinModal = document.getElementById("spin-wheel-modal");
    const spinTrigger = document.getElementById("spin-wheel-trigger");
    const spinClose = document.getElementById("spin-wheel-close");
    const spinBtn = document.getElementById("spin-btn");
    const canvas = document.getElementById("wheel-canvas");
    const resultBox = document.getElementById("spin-result-box");
    const prizeText = document.getElementById("spin-prize-text");
    const couponCodeEl = document.getElementById("spin-coupon-code");
    const copyCouponBtn = document.getElementById("copy-coupon-btn");

    const prizes = [
        { label: "خصم 5%", code: "MESORA5", color: "#111922" },
        { label: "شحن مجاني", code: "FREESHIP", color: "#1d103c" },
        { label: "خصم 25K", code: "IRAQTECH", color: "#111922" },
        { label: "خصم 10%", code: "RTXPOWER", color: "#3a0ca3" },
        { label: "شحن مجاني", code: "FREESHIP", color: "#111922" },
        { label: "خصم 5%", code: "MESORA5", color: "#1d103c" }
    ];

    let isSpinning = false;

    const openSpinWheel = () => {
        if (!spinOverlay || !spinModal) return;
        spinOverlay.classList.remove("opacity-0", "pointer-events-none");
        spinModal.classList.remove("opacity-0", "pointer-events-none", "scale-95");
        spinModal.classList.add("scale-100");
        document.body.style.overflow = "hidden";
        drawWheel();
    };

    const closeSpinWheel = () => {
        if (!spinOverlay || !spinModal) return;
        spinOverlay.classList.add("opacity-0", "pointer-events-none");
        spinModal.classList.add("opacity-0", "pointer-events-none", "scale-95");
        spinModal.classList.remove("scale-100");
        document.body.style.overflow = "";
    };

    if (spinTrigger) spinTrigger.addEventListener("click", openSpinWheel);
    if (spinClose) spinClose.addEventListener("click", closeSpinWheel);
    if (spinOverlay) spinOverlay.addEventListener("click", closeSpinWheel);

    const drawWheel = () => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const size = canvas.width;
        const center = size / 2;
        const radius = center - 8;

        ctx.clearRect(0, 0, size, size);

        const arc = (2 * Math.PI) / prizes.length;
        prizes.forEach((prize, idx) => {
            const angle = idx * arc;
            ctx.beginPath();
            ctx.fillStyle = prize.color;
            ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
            ctx.lineWidth = 2;
            ctx.arc(center, center, radius, angle, angle + arc);
            ctx.lineTo(center, center);
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px Cairo, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.translate(center, center);
            ctx.rotate(angle + arc / 2);
            ctx.fillText(prize.label, radius * 0.65, 0);
            ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#A855F7";
        ctx.stroke();
    };

    if (spinBtn) {
        spinBtn.addEventListener("click", () => {
            if (isSpinning) return;
            isSpinning = true;
            if (resultBox) resultBox.classList.add("hidden");

            const prizeIdx = Math.floor(Math.random() * prizes.length);
            const prize = prizes[prizeIdx];

            const degreesPerSegment = 360 / prizes.length;
            const targetDegree = 360 - (prizeIdx * degreesPerSegment) - (degreesPerSegment / 2);
            const totalSpinDegree = 3600 + targetDegree;

            if (canvas) {
                canvas.style.transform = `rotate(${totalSpinDegree}deg)`;
            }

            setTimeout(() => {
                isSpinning = false;
                if (canvas) {
                    canvas.style.transition = "none";
                    canvas.style.transform = `rotate(${targetDegree}deg)`;
                    setTimeout(() => {
                        canvas.style.transition = "transform 4000ms ease-out";
                    }, 50);
                }

                if (prizeText) prizeText.textContent = `${prize.label} (${ACTIVE_COUPONS[prize.code].label})`;
                if (couponCodeEl) couponCodeEl.textContent = prize.code;
                if (resultBox) resultBox.classList.remove("hidden");

                showToast(`🎁 ربحت كوبون خصم: ${prize.code}`);
            }, 4100);
        });
    }

    if (copyCouponBtn && couponCodeEl) {
        copyCouponBtn.addEventListener("click", () => {
            const code = couponCodeEl.textContent;
            navigator.clipboard.writeText(code).then(() => {
                showToast("📋 تم نسخ الكود بنجاح! طبقه في السلة.");
            });
        });
    }

    // ==========================================================================
    // Feature 13: Interactive Live Reviews Board Engine (with localStorage)
    // ==========================================================================
    
    const DEFAULT_REVIEWS = [
        { name: "أحمد ك.", city: "بغداد", rating: 5, text: "اشتريت معالج مستعمل بحالة ممتازة، الفحص كان دقيق والتوصيل خلال يوم واحد. أنصح بميسورا بشدة. الخدمة الاحترافية والأسعار المنافسة جعلتني أعيد زيارتهم بالتأكيد!" },
        { name: "سارة م.", city: "أربيل", rating: 5, text: "جمعوا لي جهاز ألعاب كامل بميزانية محددة. كل قطعة مختارة بعناية والأداء فاق توقعاتي. فريق مهني ومتعاون يلبي جميع احتياجاتي." },
        { name: "علي ر.", city: "البصرة", rating: 5, text: "تواصلوا معي بسرعة ووفروا لي كرت شاشة نادر لم أجده في أي مكان آخر. خدمة محترفة تستحق التوصية للجميع الذين يبحثون عن قطع أصلية بأسعار عادلة." },
        { name: "محمد ح.", city: "كربلاء", rating: 4, text: "اشتريت منتجات عدة من ميسورا وكلها كانت بحالة ممتازة. التغليف كان احترافي والتوصيل كان سريعاً جداً. سأعود بالتأكيد." },
        { name: "فاطمة ع.", city: "نجف", rating: 5, text: "ميسورا أفضل متجر تقني في العراق. لوحة أم ومعالج وكرت شاشة جديدة، كلها أصلية مع ضمان. الدعم الفني قبل وبعد البيع مميز جداً." },
        { name: "حسن م.", city: "أهواز", rating: 3, text: "الأسعار شوية مرتفعة مقارنة بالسوق لكن الجودة مضمونة والضمان حقيقي. التجميع كان احترافي وفريق العمل واضح الاحتراف." },
        { name: "زينب س.", city: "الكاظمية", rating: 5, text: "خدمة عملاء مميزة! استفسرت عن قطعة غير متوفرة ووعدوني بإيجادها خلال أسبوع. الوفاء بالوعد والأسعار النصية جعلتني أثق بهم تمامًا." },
        { name: "خالد و.", city: "الأنبار", rating: 4, text: "جهازي الجديد يعمل بشكل ممتاز بعد شهر من الاستخدام. شكراً لفريق ميسورا على اختيار القطع المناسبة لميزانيتي. توصية بخالص التقدير." }
    ];

    const MAX_REVIEW_TEXT_LENGTH = 80;
    const REVIEWS_PER_PAGE = 3;

    const reviewsListContainer = document.getElementById("reviews-list-container");
    const reviewFormContainer = document.getElementById("review-form-container");
    const reviewToggleBtn = document.getElementById("review-toggle-form-btn");
    const addReviewForm = document.getElementById("add-review-form");
    const reviewNameInput = document.getElementById("review-name");
    const reviewCityInput = document.getElementById("review-city");
    const reviewTextInput = document.getElementById("review-text");
    const starSelector = document.getElementById("rating-star-selector");

    let selectedRating = 0;
    let reviewSortOrder = "newest";
    let currentPage = 1;

    // Store full review texts for preview toggle (avoids HTML attribute escaping issues)
    const reviewTextMap = new Map();

    const escapeHtml = (text) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    };

    const loadReviews = () => {
        const stored = localStorage.getItem("mesora_reviews");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    const saveReviews = (reviews) => {
        localStorage.setItem("mesora_reviews", JSON.stringify(reviews));
    };

    const sortReviews = (reviews, order) => {
        const sorted = [...reviews];
        switch (order) {
            case "newest":
                sorted.reverse();
                break;
            case "oldest":
                // Keep original order (default reviews first, then stored in order)
                break;
            case "highest":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case "lowest":
                sorted.sort((a, b) => a.rating - b.rating);
                break;
        }
        return sorted;
    };

    const renderReviews = () => {
        if (!reviewsListContainer) return;
        const storedReviews = loadReviews();
        let allReviews = sortReviews([...DEFAULT_REVIEWS, ...storedReviews], reviewSortOrder);

        const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
        const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
        const visibleReviews = allReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

        // Clear the text map before re-populating
        reviewTextMap.clear();

        reviewsListContainer.innerHTML = visibleReviews.map((review, index) => {
            const reviewId = `${startIndex + index}`;
            reviewTextMap.set(reviewId, review.text);

            return `
            <blockquote class="mesora-testimonial bg-[#0d151e] border border-[rgba(0,163,196,0.25)] rounded-xl p-3 shadow-xl relative overflow-hidden">
                <div class="flex items-start justify-between gap-3 mb-1.5">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <strong class="text-xs text-white">${escapeHtml(review.name)}</strong>
                            <button type="button" class="review-preview-btn text-[#00E5FF] hover:text-[#33b8d4] transition-colors cursor-pointer" data-review-id="${reviewId}" title="معاينة التعليق">
                                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                        <span class="block text-[9px] text-[#8A9AAD]/70">${escapeHtml(review.city)}</span>
                    </div>
                    <div class="text-left shrink-0">
                         <div class="mesora-stars flex items-center gap-0.5 mb-0.5" aria-label="تقييم ${review.rating} من 5">
                            ${Array.from({ length: 5 }, (_, i) => 
                                `<span class="${i < review.rating ? 'text-[#C5A059]' : 'text-[#3a4250]'} text-[10px]">★</span>`
                            ).join("")}
                        </div>
                        <span class="text-[9px] text-[#C5A059] font-mono bg-[#111922] px-1.5 py-0.5 rounded-full border border-[rgba(0,163,196,0.2)]">${review.rating}.0</span>
                    </div>
                </div>
                <div class="review-text-container hidden mt-2 pt-2 border-t border-white/5" id="text-container-${reviewId}">
                    <p class="text-[11px] text-[#8A9AAD] leading-relaxed review-full-text">
                        ${escapeHtml(review.text)}
                    </p>
                </div>
            </blockquote>
            `;
        }).join("");

        // Render automatic pagination
        const paginationContainer = document.getElementById("review-pagination-container");
        if (paginationContainer) {
            if (totalPages > 1) {
                let paginationHTML = `
                    <div class="flex items-center justify-center gap-2 pt-4">
                        <button type="button" id="review-prev-page" class="px-3 py-1.5 rounded-lg bg-[#111922] border border-[rgba(0,163,196,0.3)] text-[#8A9AAD] hover:text-[#00E5FF] hover:border-[#00E5FF] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </button>
                `;

                const maxPageButtons = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
                let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

                if (endPage - startPage < maxPageButtons - 1) {
                    startPage = Math.max(1, endPage - maxPageButtons + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                    paginationHTML += `
                        <button type="button" class="review-page-btn px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${i === currentPage ? 'active bg-[#00E5FF] text-[#0a0f14] border-[#00E5FF]' : 'bg-[#111922] border-[rgba(0,163,196,0.3)] text-[#8A9AAD] hover:text-[#00E5FF] hover:border-[#00E5FF]'}">
                            ${i}
                        </button>
                    `;
                }

                paginationHTML += `
                        <button type="button" id="review-next-page" class="px-3 py-1.5 rounded-lg bg-[#111922] border border-[rgba(0,163,196,0.3)] text-[#8A9AAD] hover:text-[#00E5FF] hover:border-[#00E5FF] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">
                            <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <div class="text-center pt-2">
                        <span class="text-[10px] text-[#8A9AAD]">صفحة ${currentPage} من ${totalPages}</span>
                    </div>
                `;
                paginationContainer.innerHTML = paginationHTML;

                // Pagination event listeners
                const prevBtn = document.getElementById("review-prev-page");
                const nextBtn = document.getElementById("review-next-page");

                if (prevBtn) {
                    prevBtn.disabled = currentPage === 1;
                    prevBtn.addEventListener("click", () => {
                        if (currentPage > 1) {
                            currentPage--;
                            renderReviews();
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.disabled = currentPage === totalPages;
                    nextBtn.addEventListener("click", () => {
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderReviews();
                        }
                    });
                }

                document.querySelectorAll(".review-page-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        currentPage = Number(btn.textContent);
                        renderReviews();
                    });
                });

                if (typeof lucide !== "undefined") lucide.createIcons();
            } else {
                paginationContainer.innerHTML = "";
            }
        }
    };

    const updateReviewSummary = () => {
        const storedReviews = loadReviews();
        const allReviews = [...DEFAULT_REVIEWS, ...storedReviews];
        const total = allReviews.length;
        const avg = total > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / total) : 0;
        const avgRounded = Math.round(avg * 10) / 10;

        const avgScoreEl = document.getElementById("review-avg-score");
        const avgStarsEl = document.getElementById("review-avg-stars");
        const totalCountEl = document.getElementById("review-total-count");

        if (avgScoreEl) avgScoreEl.textContent = avgRounded.toFixed(1);
        if (totalCountEl) totalCountEl.textContent = `بناءً على ${total} تقييمات`;

        if (avgStarsEl) {
            const fullStars = Math.floor(avg);
            const hasHalf = avg - fullStars >= 0.25 && avg - fullStars < 0.75;
            const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
            let starsHTML = "";
            for (let i = 0; i < fullStars; i++) starsHTML += '<span class="text-[#C5A059] text-xs">★</span>';
            if (hasHalf) starsHTML += '<span class="text-[#C5A059] text-xs">★</span>';
            for (let i = 0; i < emptyStars; i++) starsHTML += '<span class="text-[#3a4250] text-xs">★</span>';
            avgStarsEl.innerHTML = starsHTML;
        }

        // Update star breakdown bars
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
        });

        for (let i = 1; i <= 5; i++) {
            const barEl = document.getElementById(`bar-${i}-star`);
            const countEl = document.getElementById(`count-${i}-star`);
            if (barEl) {
                const percentage = total > 0 ? (breakdown[i] / total) * 100 : 0;
                barEl.style.width = `${percentage}%`;
            }
            if (countEl) {
                const percentage = total > 0 ? Math.round((breakdown[i] / total) * 100) : 0;
                countEl.textContent = `${percentage}%`;
            }
        }
    };

    // Initialize star selector buttons
    if (starSelector) {
        const starBtns = starSelector.querySelectorAll(".star-select-btn");
        starBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                selectedRating = Number(btn.getAttribute("data-star"));
                starBtns.forEach((b, idx) => {
                    if (idx < selectedRating) {
                        b.classList.add("text-[#C5A059]");
                        b.classList.remove("text-[#3a4250]");
                    } else {
                        b.classList.remove("text-[#C5A059]");
                        b.classList.add("text-[#3a4250]");
                    }
                });
            });
        });
    }

    // Toggle review form visibility
    if (reviewToggleBtn && reviewFormContainer) {
        reviewToggleBtn.addEventListener("click", () => {
            reviewFormContainer.classList.toggle("hidden");
            reviewToggleBtn.innerHTML = reviewFormContainer.classList.contains("hidden")
                ? '<i data-lucide="edit-3" class="w-4 h-4"></i> أضف تقييمك الآن'
                : '<i data-lucide="x" class="w-4 h-4"></i> إغلاق النموذج';
            if (typeof lucide !== "undefined") lucide.createIcons();
        });
    }

    // Handle review form submission
    if (addReviewForm) {
        addReviewForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = reviewNameInput ? reviewNameInput.value.trim() : "";
            const city = reviewCityInput ? reviewCityInput.value.trim() : "";
            const text = reviewTextInput ? reviewTextInput.value.trim() : "";

            if (!name || !city || !text || selectedRating === 0) {
                showToast("⚠️ يرجى ملء جميع الحقول واختيار تقييمك بالنجوم");
                return;
            }

            const newReview = { name, city, rating: selectedRating, text };
            const stored = loadReviews();
            stored.push(newReview);
            saveReviews(stored);

            // Reset to first page when new review is added
            currentPage = 1;
            renderReviews();
            updateReviewSummary();

            // Reset form
            addReviewForm.reset();
            selectedRating = 0;
            if (starSelector) {
                starSelector.querySelectorAll(".star-select-btn").forEach(btn => {
                    btn.classList.remove("text-[#C5A059]");
                    btn.classList.add("text-[#3a4250]");
                });
            }

            if (reviewFormContainer) reviewFormContainer.classList.add("hidden");
            if (reviewToggleBtn) reviewToggleBtn.innerHTML = '<i data-lucide="edit-3" class="w-4 h-4"></i> أضف تقييمك الآن';
            if (typeof lucide !== "undefined") lucide.createIcons();

            showToast("🌟 شكراً لك! تم نشر تقييمك بنجاح");
        });
    }

    // Preview icon click handler (toggles comment container)
    if (reviewsListContainer) {
        reviewsListContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".review-preview-btn");
            if (btn) {
                const reviewId = btn.getAttribute("data-review-id");
                const container = document.getElementById(`text-container-${reviewId}`);
                if (container) {
                    const isHidden = container.classList.contains("hidden");
                    
                    // Close other open reviews first for a cleaner UI
                    document.querySelectorAll(".review-text-container").forEach(c => {
                        if (c.id !== `text-container-${reviewId}`) c.classList.add("hidden");
                    });

                    // Toggle current
                    container.classList.toggle("hidden");
                    
                    // Toggle icon rotation or color if needed
                    btn.classList.toggle("text-[#C5A059]", !isHidden);
                    btn.classList.toggle("text-[#00E5FF]", isHidden);
                    
                    if (!isHidden) {
                        showToast("تم إغلاق المعاينة");
                    }
                }
            }
        });
    }

    // ==========================================================================
    // Feature 14: Review Sorting & Automatic Pagination Engine
    // ==========================================================================
    
    const reviewSortSelect = document.getElementById("review-sort-select");

    // Reset to first page when sort order changes
    if (reviewSortSelect) {
        reviewSortSelect.addEventListener("change", () => {
            reviewSortOrder = reviewSortSelect.value;
            currentPage = 1;
            renderReviews();
        });
    }

    // Initial render of reviews and summary
    renderReviews();
    updateReviewSummary();

    // ==========================================================================
    // Feature 15: Cyber Hardware Dashboard Categories Matrix
    // ==========================================================================
    const initCyberDashCategories = () => {
        const categoryCards = document.querySelectorAll('.cyber-dash-card');

        // Re-initialize Lucide icons for icons inside cards and trust bar
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        categoryCards.forEach(card => {
            const category = card.getAttribute('data-category');

            // 1. Subtle 3D Perspective Tilt on mouse move
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -6; // Soft Pitch
                const rotateY = ((x - centerX) / centerX) * 6;  // Soft Yaw

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
            });

            // 2. Click Handler to trigger existing product filtering seamlessly
            card.addEventListener('click', () => {
                const productsSection = document.getElementById('products');
                
                const targetFilterBtn = document.querySelector(`[data-filter="${category}"], [data-product-filter="${category}"]`);
                if (targetFilterBtn) {
                    targetFilterBtn.click();
                }

                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                const catName = card.querySelector('.cyber-card-name')?.textContent || category;
                if (typeof showToast === 'function') {
                    showToast(`تم اختيار فئة: ${catName}`);
                }
            });
        });
    };

    initCyberDashCategories();

    // ==========================================================================
    // Feature 16: Mobile Bottom Navigation Bar
    // ==========================================================================
    const initBottomNav = () => {
        const bottomNavCartBtn = document.getElementById('bottom-nav-cart');
        const cartToggleBtn = document.getElementById('cart-toggle-btn');

        // Bottom Nav Cart button opens the same cart drawer
        if (bottomNavCartBtn && cartToggleBtn) {
            bottomNavCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cartToggleBtn.click();
            });
        }

        // Update active state in bottom nav based on scroll position
        const bottomNavItems = document.querySelectorAll('.mesora-bottom-nav-item');
        const sections = ['home', 'categories', 'featured', 'contact'];

        const updateBottomNavActive = () => {
            if (!bottomNavItems.length) return;
            const scrollPos = window.scrollY + 100;

            let activeSection = 'home';
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= scrollPos) {
                    activeSection = id;
                }
            });

            bottomNavItems.forEach(item => {
                const href = item.getAttribute('href');
                const isActive = href === `#${activeSection}`;
                item.classList.toggle('active', isActive);
            });
        };

        // Bind scroll listener
        // (removed the broken "updateScrollProgress || function(){}" line — that variable
        // was never defined anywhere in this file and threw a ReferenceError, which stopped
        // all remaining script execution, including the final load->scroll dispatch below)
        window.addEventListener('scroll', () => {
            if (typeof updateBottomNavScroll === 'function') {
                updateBottomNavScroll();
            }
        });
        window.addEventListener('scroll', updateBottomNavActive);

        // Re-init Lucide for bottom nav icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    };

    initBottomNav();
    window.addEventListener('load', function () {
  window.dispatchEvent(new Event('scroll'));
});
    // ==========================================================================
    // Feature 17: Advanced Customize Theme Modal & Live Preview
    // ==========================================================================
    const initCustomizer = () => {
        const customizeBtn = document.getElementById('customize-theme-btn');
        const customizeClose = document.getElementById('customize-theme-close');
        const customizeOverlay = document.getElementById('customize-theme-overlay');
        const customizeModal = document.getElementById('customize-theme-modal');
        const cancelBtn = document.getElementById('customizer-cancel-btn');
        const resetBtn = document.getElementById('customizer-reset-btn');
        const saveBtn = document.getElementById('customizer-save-btn');

        // State tracking for unsaved changes
        let pendingTheme = null;
        let pendingCursorShape = null;
        let pendingFontStyle = null;

        // Cursor SVG definitions (enhanced with more detail)
        const CURSOR_SVGS = {
            cpu: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <path d="M12 3V7 M20 3V7 M28 3V7 M12 33V37 M20 33V37 M28 33V37 M3 12H7 M3 20H7 M3 28H7 M33 12H37 M33 20H37 M33 28H37" stroke="#C5A059" stroke-width="2.2" stroke-linecap="round"/>
                <rect x="7" y="7" width="26" height="26" rx="5" fill="#0b131c" stroke="#00A3C4" stroke-width="1.8"/>
                <rect x="14" y="14" width="12" height="12" rx="2.5" fill="url(#cpu-grad)" stroke="#C5A059" stroke-width="1.2"/>
                <circle cx="10.5" cy="10.5" r="1.3" fill="#00E5FF"/>
                <circle cx="29.5" cy="10.5" r="1.3" fill="#00E5FF"/>
                <circle cx="10.5" cy="29.5" r="1.3" fill="#00E5FF"/>
                <circle cx="29.5" cy="29.5" r="1.3" fill="#00E5FF"/>
                <defs><linearGradient id="cpu-grad" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00E5FF"/><stop offset="50%" stop-color="#00A3C4"/><stop offset="100%" stop-color="#C5A059"/></linearGradient></defs>
            </svg>`,
            gpu: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <rect x="3" y="25" width="34" height="10" rx="2" fill="#0b131c" stroke="#A855F7" stroke-width="1.5"/>
                <rect x="5" y="12" width="30" height="15" rx="1.5" fill="#0b131c" stroke="#00E5FF" stroke-width="1.5"/>
                <circle cx="10" cy="19" r="2.5" fill="#A855F7"/>
                <rect x="15" y="17" width="15" height="4" rx="1" fill="#00E5FF"/>
                <circle cx="30" cy="30" r="2" fill="#C5A059"/>
                <circle cx="10" cy="30" r="2" fill="#C5A059"/>
            </svg>`,
            ssd: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <rect x="3" y="10" width="34" height="20" rx="3" fill="#0b131c" stroke="#00E5FF" stroke-width="1.5"/>
                <rect x="6" y="13" width="16" height="6" rx="1" fill="#C5A059" opacity="0.6"/>
                <rect x="25" y="13" width="9" height="6" rx="1" fill="#00E5FF" opacity="0.6"/>
                <circle cx="8" cy="25" r="2" fill="#10B981"/>
                <circle cx="32" cy="25" r="2" fill="#10B981"/>
                <rect x="10" y="29" width="20" height="2" rx="1" fill="#00E5FF" opacity="0.3"/>
            </svg>`,
            ram: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <rect x="8" y="3" width="24" height="34" rx="2" fill="#0b131c" stroke="#10B981" stroke-width="1.5"/>
                <rect x="11" y="7" width="18" height="26" rx="1" fill="#111922"/>
                <rect x="14" y="10" width="12" height="4" fill="#10B981" opacity="0.6"/>
                <rect x="14" y="17" width="12" height="4" fill="#10B981" opacity="0.6"/>
                <rect x="14" y="24" width="12" height="4" fill="#10B981" opacity="0.6"/>
                <rect x="29" y="9" width="2" height="5" fill="#C5A059" opacity="0.5"/>
                <rect x="29" y="16" width="2" height="5" fill="#C5A059" opacity="0.5"/>
                <rect x="29" y="23" width="2" height="5" fill="#C5A059" opacity="0.5"/>
            </svg>`,
            motherboard: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <rect x="3" y="3" width="34" height="34" rx="3" fill="#0b131c" stroke="#06B6D4" stroke-width="1.5"/>
                <rect x="7" y="7" width="12" height="12" rx="2" fill="#111922" stroke="#00E5FF" stroke-width="1"/>
                <rect x="23" y="7" width="10" height="6" rx="1" fill="#111922" stroke="#C5A059" stroke-width="1"/>
                <rect x="23" y="17" width="10" height="6" rx="1" fill="#111922" stroke="#C5A059" stroke-width="1"/>
                <rect x="7" y="23" width="12" height="10" rx="1" fill="#111922" stroke="#00E5FF" stroke-width="1"/>
                <circle cx="32" cy="31" r="3" fill="#10B981"/>
                <circle cx="9" cy="19" r="1.5" fill="#00E5FF"/>
                <circle cx="27" cy="27" r="1.5" fill="#06B6D4"/>
            </svg>`,
            fan: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <circle cx="20" cy="20" r="15" fill="#0b131c" stroke="#EAB308" stroke-width="1.5"/>
                <path d="M20 5 Q30 10 20 20 Q10 30 20 35 Q30 30 20 20 Q10 10 20 5" fill="#EAB308" opacity="0.5"/>
                <circle cx="20" cy="20" r="4" fill="#EAB308"/>
                <circle cx="20" cy="20" r="2" fill="#0b131c"/>
                <path d="M20 5 L22 10 M20 35 L18 30 M5 20 L10 18 M35 20 L30 22" stroke="#EAB308" stroke-width="1" opacity="0.7"/>
            </svg>`,
            chip: `<svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <rect x="8" y="8" width="24" height="24" rx="2" fill="#0b131c" stroke="#EF4444" stroke-width="1.5"/>
                <rect x="14" y="14" width="12" height="12" rx="1" fill="#111922" stroke="#C5A059" stroke-width="1"/>
                <path d="M12 8V4 M20 8V4 M28 8V4 M12 36V32 M20 36V32 M28 36V32 M8 12H4 M8 20H4 M8 28H4 M36 12H32 M36 20H32 M36 28H32" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="20" cy="20" r="3" fill="#EF4444" opacity="0.4"/>
            </svg>`,
            off: ``
        };

        const applyCursorShape = (shape) => {
            const cpuCursor = document.getElementById('mesora-cursor-cpu');
            if (!cpuCursor) return;

            if (shape === 'off' || isSmallScreen) {
                cpuCursor.style.display = 'none';
            } else {
                cpuCursor.style.display = '';
                cpuCursor.innerHTML = CURSOR_SVGS[shape] || CURSOR_SVGS.cpu;
            }
        };

        // Update live preview cursor shape
        const updateCursorPreview = (shape) => {
            const previewEl = document.getElementById('cursor-preview-shape');
            const labelEl = document.getElementById('cursor-preview-label');
            if (!previewEl) return;

            if (shape === 'off') {
                previewEl.innerHTML = '<i data-lucide="ban" class="w-6 h-6 text-[#8A9AAD]"></i>';
                if (labelEl) labelEl.textContent = 'المؤشر مخصص - إيقاف';
            } else {
                previewEl.innerHTML = CURSOR_SVGS[shape] || CURSOR_SVGS.cpu;
                const names = { cpu: 'معالج', gpu: 'كرت شاشة', ssd: 'هارد SSD', ram: 'ذاكرة RAM', motherboard: 'لوحة أم', fan: 'مروحة', chip: 'شريحة', off: 'إيقاف' };
                if (labelEl) labelEl.textContent = `${names[shape] || shape} - حرك الماوس للعرض`;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        // Highlight active buttons
        const highlightTheme = (themeKey) => {
            document.querySelectorAll('.theme-option-btn').forEach(b => {
                const active = b.getAttribute('data-theme-color') === themeKey;
                b.style.borderColor = active ? '#00E5FF' : '';
                b.classList.toggle('ring-1', active);
                b.classList.toggle('ring-[#00E5FF]', active);
            });
        };

        const highlightCursorShape = (shape) => {
            document.querySelectorAll('.cursor-shape-btn').forEach(btn => {
                const active = btn.getAttribute('data-cursor-shape') === shape;
                btn.style.borderColor = active ? '#00E5FF' : '';
                btn.classList.toggle('ring-1', active);
                btn.classList.toggle('ring-[#00E5FF]', active);
            });
        };

        const highlightFontStyle = (style) => {
            document.querySelectorAll('.font-style-btn').forEach(b => {
                const active = b.getAttribute('data-font-style') === style;
                b.style.borderColor = active ? '#00E5FF' : '';
                b.classList.toggle('ring-1', active);
                b.classList.toggle('ring-[#00E5FF]', active);
            });
        };

        // Update live preview theme colors
        const updatePreviewTheme = (themeKey) => {
            const theme = themeColors[themeKey] || themeColors.cyan;
            const preview = document.getElementById('live-preview-panel');
            if (!preview) return;

            // Update accent elements in preview
            const accentEls = preview.querySelectorAll('.preview-accent, .preview-kicker, .preview-btn-secondary, .preview-card i, .preview-logo-ring');
            accentEls.forEach(el => {
                el.style.color = theme.teal;
            });

            const kickerEl = preview.querySelector('.preview-kicker');
            if (kickerEl) {
                kickerEl.style.background = `rgba(0,163,196,0.1)`;
                kickerEl.style.borderColor = `rgba(0,163,196,0.3)`;
            }

            // Update preview price colors
            const priceEls = preview.querySelectorAll('.preview-price');
            priceEls.forEach(el => el.style.color = '#C5A059');
        };

        // Open/Close modal
        const openCustomizer = () => {
            if (!customizeOverlay || !customizeModal) return;
            customizeOverlay.classList.remove('opacity-0', 'pointer-events-none');
            customizeModal.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            customizeModal.classList.add('scale-100');
            document.body.style.overflow = 'hidden';

            // Load saved state
            const savedTheme = localStorage.getItem('mesora_neon_theme') || 'cyan';
            const savedCursor = localStorage.getItem('mesora_cursor_shape') || 'cpu';
            const savedFont = localStorage.getItem('mesora_font_style') || 'modern';

            pendingTheme = savedTheme;
            pendingCursorShape = savedCursor;
            pendingFontStyle = savedFont;

            highlightTheme(savedTheme);
            highlightCursorShape(savedCursor);
            highlightFontStyle(savedFont);
            updateCursorPreview(savedCursor);
            updatePreviewTheme(savedTheme);
        };

        const closeCustomizer = () => {
            if (!customizeOverlay || !customizeModal) return;
            customizeOverlay.classList.add('opacity-0', 'pointer-events-none');
            customizeModal.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            customizeModal.classList.remove('scale-100');
            document.body.style.overflow = '';
        };

        if (customizeBtn) customizeBtn.addEventListener('click', openCustomizer);
        if (customizeClose) customizeClose.addEventListener('click', closeCustomizer);
        if (customizeOverlay) customizeOverlay.addEventListener('click', closeCustomizer);

        // Cancel button - revert changes
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const savedTheme = localStorage.getItem('mesora_neon_theme') || 'cyan';
                const savedCursor = localStorage.getItem('mesora_cursor_shape') || 'cpu';
                applyThemeColor(savedTheme);
                applyCursorShape(savedCursor);
                closeCustomizer();
                showToast('تم إلغاء التغييرات');
            });
        }

        // Reset button - restore defaults
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                applyThemeColor('cyan');
                applyCursorShape('cpu');
                highlightTheme('cyan');
                highlightCursorShape('cpu');
                highlightFontStyle('modern');
                updateCursorPreview('cpu');
                updatePreviewTheme('cyan');
                showToast('🔄 تم استعادة الإعدادات الافتراضية');
            });
        }

        // Save button - apply changes permanently
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (pendingTheme) {
                    applyThemeColor(pendingTheme);
                    localStorage.setItem('mesora_neon_theme', pendingTheme);
                }
                if (pendingCursorShape) {
                    applyCursorShape(pendingCursorShape);
                    localStorage.setItem('mesora_cursor_shape', pendingCursorShape);
                }
                closeCustomizer();
                showToast('✅ تم حفظ التغييرات بنجاح');
            });
        }

        // Theme selection with live preview
        document.querySelectorAll('.theme-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeKey = btn.getAttribute('data-theme-color');
                pendingTheme = themeKey;
                highlightTheme(themeKey);
                updatePreviewTheme(themeKey);
                // Preview theme immediately but don't save yet
                const theme = themeColors[themeKey] || themeColors.cyan;
                document.documentElement.style.setProperty('--mesora-teal', theme.teal);
                document.documentElement.style.setProperty('--mesora-teal-glow', theme.glow);
            });
        });

        // Cursor selection with live preview
        document.querySelectorAll('.cursor-shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const shape = btn.getAttribute('data-cursor-shape');
                pendingCursorShape = shape;
                highlightCursorShape(shape);
                updateCursorPreview(shape);
                // Preview immediately
                applyCursorShape(shape);
            });
        });

        // Font style selection
        document.querySelectorAll('.font-style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const style = btn.getAttribute('data-font-style');
                pendingFontStyle = style;
                highlightFontStyle(style);
                if (style === 'orbitron') {
                    document.documentElement.style.setProperty('--font-heading', "'Orbitron', sans-serif");
                } else {
                    document.documentElement.style.setProperty('--font-heading', "'Exo 2', 'Cairo', sans-serif");
                }
            });
        });

        // Mouse tracking for cursor preview animation
        const previewArea = document.getElementById('cursor-preview-area');
        if (previewArea) {
            previewArea.addEventListener('mousemove', (e) => {
                const rect = previewArea.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width - 0.5);
                const y = ((e.clientY - rect.top) / rect.height - 0.5);
                const previewShape = document.getElementById('cursor-preview-shape');
                if (previewShape) {
                    previewShape.style.transform = `rotate(${x * 20}deg) translate(${x * 8}px, ${y * 8}px)`;
                }
            });
            previewArea.addEventListener('mouseleave', () => {
                const previewShape = document.getElementById('cursor-preview-shape');
                if (previewShape) previewShape.style.transform = '';
            });
        }

        // Apply saved cursor shape on page load
        if (isSmallScreen) {
            const cpuCursor = document.getElementById('mesora-cursor-cpu');
            if (cpuCursor) cpuCursor.style.display = 'none';
        }
        const savedCursorShape = localStorage.getItem('mesora_cursor_shape');
        if (savedCursorShape && savedCursorShape !== 'cpu') {
            setTimeout(() => {
                applyCursorShape(savedCursorShape);
                updateCursorPreview(savedCursorShape);
                highlightCursorShape(savedCursorShape);
            }, 50);
        }
    };

    initCustomizer();

    // ==========================================================================
    // 1. Flash Deals Live Countdown Timer
    // ==========================================================================
    function startFlashTimer() {
        let hours = 8, minutes = 45, seconds = 30;
        const hEl = document.getElementById('timer-hours');
        const mEl = document.getElementById('timer-minutes');
        const sEl = document.getElementById('timer-seconds');
        if (!hEl || !mEl || !sEl) return;

        setInterval(() => {
            if (seconds > 0) {
                seconds--;
            } else {
                seconds = 59;
                if (minutes > 0) {
                    minutes--;
                } else {
                    minutes = 59;
                    if (hours > 0) hours--;
                    else hours = 12;
                }
            }
            hEl.textContent = String(hours).padStart(2, '0');
            mEl.textContent = String(minutes).padStart(2, '0');
            sEl.textContent = String(seconds).padStart(2, '0');
        }, 1000);
    }
    startFlashTimer();

    // ==========================================================================
    // 2. PC Builder Wattage Calculator & PDF Export
    // ==========================================================================
    const builderWattageMap = {
        'Intel Core i5-13400F': 65,
        'Intel Core i7-14700K': 125,
        'AMD Ryzen 7 7800X3D': 120,
        'NVIDIA RTX 4060 8GB': 115,
        'NVIDIA RTX 4070 Super 12GB': 220,
        'NVIDIA RTX 4080 Super 16GB': 320
    };

    function updateBuilderCompatibilityAndWattage() {
        const cpuSelect = document.querySelector('select[name="builder-cpu"]');
        const mbSelect = document.querySelector('select[name="builder-mb"]');
        const gpuSelect = document.querySelector('select[name="builder-gpu"]');
        const psuSelect = document.querySelector('select[name="builder-psu"]');

        const compatBox = document.getElementById('builder-compatibility-box');
        const compatStatus = document.getElementById('builder-compat-status');
        const wattsEl = document.getElementById('builder-total-watts');
        const psuStatus = document.getElementById('builder-psu-status');
        const compatMsg = document.getElementById('builder-compat-msg');

        if (!compatBox) return;

        const cpuVal = cpuSelect ? cpuSelect.value : '';
        const mbVal = mbSelect ? mbSelect.value : '';
        const gpuVal = gpuSelect ? gpuSelect.value : '';
        const psuVal = psuSelect ? psuSelect.value : '';

        let estWatts = 100; // Base motherboard/system draw
        if (cpuVal && builderWattageMap[cpuVal]) estWatts += builderWattageMap[cpuVal];
        if (gpuVal && builderWattageMap[gpuVal]) estWatts += builderWattageMap[gpuVal];

        compatBox.classList.remove('hidden');
        if (wattsEl) wattsEl.textContent = estWatts + ' واط (W)';

        // Compatibility check
        let isCompatible = true;
        let warningText = '';

        if (cpuVal && mbVal) {
            const isIntelCpu = cpuVal.toLowerCase().includes('intel');
            const isAmdCpu = cpuVal.toLowerCase().includes('amd') || cpuVal.toLowerCase().includes('ryzen');
            const isIntelMb = mbVal.toLowerCase().includes('lga') || mbVal.toLowerCase().includes('b760') || mbVal.toLowerCase().includes('z790');
            const isAmdMb = mbVal.toLowerCase().includes('am5') || mbVal.toLowerCase().includes('b650') || mbVal.toLowerCase().includes('x670');

            if (isIntelCpu && isAmdMb) {
                isCompatible = false;
                warningText = '⚠️ تنبيه: المعالج Intel غير متوافق مع لوحة الأم AMD (AM5)';
            } else if (isAmdCpu && isIntelMb) {
                isCompatible = false;
                warningText = '⚠️ تنبيه: المعالج AMD غير متوافق مع لوحة الأم Intel (LGA1700)';
            }
        }

        if (compatStatus) {
            if (isCompatible) {
                compatStatus.className = 'font-bold text-emerald-400 flex items-center gap-1';
                compatStatus.innerHTML = '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> متوافق 100%';
            } else {
                compatStatus.className = 'font-bold text-red-400 flex items-center gap-1';
                compatStatus.innerHTML = '<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> غير متوافق';
            }
        }

        if (compatMsg) compatMsg.textContent = warningText;

        // PSU Wattage recommendation check
        if (psuStatus) {
            let psuWatt = 0;
            if (psuVal.includes('650W')) psuWatt = 650;
            else if (psuVal.includes('750W')) psuWatt = 750;
            else if (psuVal.includes('1000W')) psuWatt = 1000;

            if (psuWatt === 0) {
                psuStatus.className = 'font-bold text-[#8A9AAD]';
                psuStatus.textContent = 'لم يتم الاختيار';
            } else if (psuWatt >= estWatts + 100) {
                psuStatus.className = 'font-bold text-emerald-400';
                psuStatus.textContent = 'كافٍ وممتاز (' + psuWatt + 'W)';
            } else {
                psuStatus.className = 'font-bold text-red-400';
                psuStatus.textContent = 'ضعيف للتجميعة (' + psuWatt + 'W)';
            }
        }
        if (window.lucide) lucide.createIcons();
    }

    document.querySelectorAll('.builder-select').forEach(sel => {
        sel.addEventListener('change', updateBuilderCompatibilityAndWattage);
    });

    // PDF Export for PC Builder
    const exportPdfBtn = document.getElementById('builder-export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            const summaryList = document.getElementById('builder-summary-list');
            const totalPrice = document.getElementById('builder-total-price');
            const wattsText = document.getElementById('builder-total-watts');

            if (!summaryList || summaryList.children.length === 0) {
                alert('⚠️ يرجى اختيار قطع التجميعة أولاً قبل التصدير!');
                return;
            }

            const printWin = window.open('', '_blank');
            printWin.document.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>MESORA — فاتورة مواصفات التجميعة</title>
                    <style>
                        body { font-family: 'Cairo', sans-serif; padding: 40px; background: #fff; color: #111; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00E5FF; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand { font-size: 24px; font-weight: bold; color: #0a0f14; }
                        h2 { text-align: center; color: #00A3C4; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-size: 14px; }
                        th { background: #f4f6f8; color: #333; }
                        .total { text-align: left; font-size: 20px; font-weight: bold; color: #C5A059; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand">MESORA TECH STORE</div>
                        <div>التاريخ: ${new Date().toLocaleDateString('ar-IQ')}</div>
                    </div>
                    <h2>مواصفات تجميعة الكمبيوتر الاحترافية</h2>
                    <table>
                        <thead>
                            <tr><th>المكون</th><th>القطعة المختارة</th></tr>
                        </thead>
                        <tbody>
                            ${Array.from(summaryList.children).map(child => `<tr><td>${child.innerText}</td></tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="total">المجموع الإجمالي: ${totalPrice ? totalPrice.innerText : '0 د.ع'}</div>
                    <div style="margin-top: 10px; font-size: 14px; color: #555;">استهلاك الطاقة المقدر: ${wattsText ? wattsText.innerText : '0W'}</div>
                    <div class="footer">متجر ميسورا للتقنية — كربلاء، العراق | هاتف: 07866554424 | www.mesora.iq</div>
                    <script>window.onload = function() { window.print(); };<\/script>
                </body>
                </html>
            `);
            printWin.document.close();
        });
    }

    // ==========================================================================
    // 3. Product Comparison Drawer & Modal System
    // ==========================================================================
    let compareList = [];
    const compareDrawer = document.getElementById('compare-drawer');
    const compareCount = document.getElementById('compare-count');
    const compareModal = document.getElementById('compare-modal');
    const openCompareBtn = document.getElementById('open-compare-modal-btn');
    const closeCompareBtn = document.getElementById('close-compare-modal-btn');
    const clearCompareBtn = document.getElementById('clear-compare-btn');
    const compareWrap = document.getElementById('compare-table-wrap');

    window.addToCompare = function(name, price, category, condition) {
        if (compareList.some(item => item.name === name)) {
            alert('المنتج مضاف بالفعل لقائمة المقارنة');
            return;
        }
        if (compareList.length >= 3) {
            alert('يمكن مقارنة 3 منتجات كحد أقصى في نفس الوقت');
            return;
        }
        compareList.push({ name, price, category, condition });
        updateCompareUI();
    };

    // Delegated handler for the compare buttons on dynamically-rendered product
    // cards. Reads the product data from the card's data-* attributes instead of
    // fragile inline onclick strings (which broke when names contained quotes).
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.mesora-compare-trigger');
        if (!trigger) return;
        const card = trigger.closest('.mesora-product-card');
        if (!card) return;
        const name = card.getAttribute('data-name') || 'منتج';
        const price = Number(card.getAttribute('data-price')) || 0;
        const category = card.getAttribute('data-category') || 'عام';
        const condition = card.getAttribute('data-condition') || 'new';
        window.addToCompare(name, price, category, condition);
    });

    function updateCompareUI() {
        if (!compareDrawer || !compareCount) return;
        compareCount.textContent = compareList.length;
        if (compareList.length > 0) {
            compareDrawer.classList.remove('hidden');
        } else {
            compareDrawer.classList.add('hidden');
        }
    }

    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', () => {
            compareList = [];
            updateCompareUI();
            if (compareModal) compareModal.classList.add('hidden');
        });
    }

    if (openCompareBtn && compareModal && compareWrap) {
        openCompareBtn.addEventListener('click', () => {
            compareModal.classList.remove('hidden');
            if (compareList.length === 0) {
                compareWrap.innerHTML = '<p class="text-center text-[#8A9AAD] py-8 text-xs">لا توجد منتجات بالمقارنة حالياً</p>';
                return;
            }
            compareWrap.innerHTML = `
                <table class="w-full text-right text-xs text-white border-collapse">
                    <thead>
                        <tr class="border-b border-white/10 text-[#00E5FF]">
                            <th class="p-3">اسم المنتج</th>
                            <th class="p-3">السعر</th>
                            <th class="p-3">الفئة</th>
                            <th class="p-3">الحالة</th>
                            <th class="p-3">الضمان</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compareList.map(item => `
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="p-3 font-bold">${item.name}</td>
                                <td class="p-3 text-[#C5A059] font-bold font-mono">${Number(item.price).toLocaleString('ar-IQ')} د.ع</td>
                                <td class="p-3">${item.category || 'عام'}</td>
                                <td class="p-3">${item.condition === 'used' ? '♻️ مستعمل' : '✨ جديد'}</td>
                                <td class="p-3 text-emerald-400">ضمان حقيقي</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        });
    }

    if (closeCompareBtn && compareModal) {
        closeCompareBtn.addEventListener('click', () => {
            compareModal.classList.add('hidden');
        });
    }

    // ==========================================================================
    // 4. Mobile Bottom Nav Scroll Active Highlighting & Cart Sync
    // ==========================================================================
    const mobileNavLinks = document.querySelectorAll('.mobile-bottom-item');
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            if (window.scrollY >= top) {
                currentSection = sec.getAttribute('id');
            }
        });
        mobileNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                link.classList.toggle('active', href.substring(1) === currentSection);
            }
        });
    });

    // ==========================================================================
    // 5. Condition Filter Handler (New vs Used)
    // ==========================================================================
    document.querySelectorAll('.mesora-cond-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cond = btn.getAttribute('data-cond-filter');
            const isAlreadyActive = btn.classList.contains('active');
            
            document.querySelectorAll('.mesora-cond-filter-btn').forEach(b => {
                b.classList.remove('active', 'border-[#00E5FF]', 'text-[#00E5FF]');
                b.classList.add('text-[#8A9AAD]', 'border-[rgba(0,163,196,0.25)]');
            });

            let activeCond = null;
            if (!isAlreadyActive) {
                btn.classList.add('active', 'border-[#00E5FF]', 'text-[#00E5FF]');
                btn.classList.remove('text-[#8A9AAD]', 'border-[rgba(0,163,196,0.25)]');
                activeCond = cond;
            }

            document.querySelectorAll('#featured-grid article.mesora-product-card').forEach(card => {
                const badge = card.querySelector('.mesora-product-badge');
                const isUsed = badge ? badge.textContent.includes('مستعمل') : false;
                if (!activeCond) {
                    card.style.display = '';
                } else if (activeCond === 'used') {
                    card.style.display = isUsed ? '' : 'none';
                } else if (activeCond === 'new') {
                    card.style.display = !isUsed ? '' : 'none';
                }
            });
        });
    });
});

