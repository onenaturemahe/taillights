import { useEffect } from "react";
import { useLocation } from "react-router";

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        // Attempt to scroll to top immediately and then after a brief timeout
        window.scrollTo(0, 0);

        const timeoutId = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 10);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
}
