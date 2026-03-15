
async function register() {
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
    }

    try {
        const res = await fetch("http://localhost:5001/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (res.ok) {
            alert("✅ Registration successful! You can now login.");
            document.getElementById("regEmail").value = "";
            document.getElementById("regPass").value = "";
        } else {
            alert("❌ " + (data.message || "Registration failed!"));
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("❌ Connection error. Please try again.");
    }
}

async function login() {
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPass").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields!");
        return;
    }

    try {
        const res = await fetch("http://localhost:5001/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("anonymousName", data.anonymousName);
            localStorage.setItem("userId", data.userId);
            window.location.href = "dashboard.html";
        } else {
            alert("❌ " + (data.message || "Invalid email or password!"));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("❌ Connection error. Please try again.");
    }
}

// Check if user is already logged in
window.addEventListener("load", function() {
    const token = localStorage.getItem("token");
    if (token) {
        window.location.href = "dashboard.html";
    }
});
