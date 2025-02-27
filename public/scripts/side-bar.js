const mobileToggle = document.getElementById("mobileToggle");
        const sidebar = document.getElementById("sidebar");
        const popup = document.getElementById("popup");
        const overlay = document.getElementById("overlay");

        function isMobile() {
            return window.innerWidth <= 768;
        }

        mobileToggle.addEventListener("click", function () {
            sidebar.classList.toggle("active");
        
            const chevronRight = document.getElementById("chevronRight");
            const chevronLeft = document.getElementById("chevronLeft");
        
            if (sidebar.classList.contains("active")) {
                chevronRight.style.display = "none";
                chevronLeft.style.display = "block";
            } else {
                chevronRight.style.display = "block";
                chevronLeft.style.display = "none";
            }
        });

        document.getElementById("reportButton").addEventListener("click", function () {
            popup.style.display = "flex";
            overlay.style.display = "block";
            if (isMobile()) {
                mobileToggle.style.display = "none";
            }
        });

        function closePopup() {
            popup.style.display = "none";
            overlay.style.display = "none";
            if (isMobile()) {
                mobileToggle.style.display = "block";
            }
        }

        window.addEventListener('resize', function() {
            if (!isMobile()) {
                mobileToggle.style.display = "none";
                sidebar.classList.remove("active");
            } else if (popup.style.display !== "flex") {
                mobileToggle.style.display = "block";
            }
        });

        if (!isMobile()) {
            mobileToggle.style.display = "none";
        }