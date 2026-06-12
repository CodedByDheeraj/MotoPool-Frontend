console.log("MotoPool Website Running 🚀");

// Logout function
function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Update navbar on page load
document.addEventListener("DOMContentLoaded", () => {
  updateNavBar();
});

function updateNavBar() {
  const user = localStorage.getItem("user");
  const userNavItem = document.getElementById("userNavItem");
  const findNavItem = document.getElementById("findNavItem");
  const inboxNavItem = document.getElementById("inboxNavItem");
  const loginNavItem = document.getElementById("loginNavItem");
  const logoutNavItem = document.getElementById("logoutNavItem");

  if (user) {
    if (userNavItem) userNavItem.style.display = "block";
    if (findNavItem) findNavItem.style.display = "block";
    if (inboxNavItem) inboxNavItem.style.display = "block";
    if (loginNavItem) loginNavItem.style.display = "none";
    if (logoutNavItem) logoutNavItem.style.display = "block";
  } else {
    if (userNavItem) userNavItem.style.display = "none";
    if (findNavItem) findNavItem.style.display = "none";
    if (inboxNavItem) inboxNavItem.style.display = "none";
    if (loginNavItem) loginNavItem.style.display = "block";
    if (logoutNavItem) logoutNavItem.style.display = "none";
  }
}

const buttons = document.querySelectorAll("button");


buttons.forEach(button => {

  button.addEventListener("click", function(e){

    const circle = document.createElement("span");

    circle.classList.add("ripple");

    const rect = button.getBoundingClientRect();

    circle.style.left = e.clientX - rect.left + "px";

    circle.style.top = e.clientY - rect.top + "px";

    this.appendChild(circle);

    setTimeout(() => {

      circle.remove();

    }, 600);

  });

});

const hiddenElements = document.querySelectorAll(".hidden");

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if(entry.isIntersecting){

      entry.target.classList.add("show");

    }

  });

});

hiddenElements.forEach((el) => observer.observe(el));

async function offerRide(event) {
  // 1. Stop the page from reloading
  event.preventDefault();

  // 2. Grab the data from the form
const user =
JSON.parse(localStorage.getItem("user"));

const rideData = {
  userId: user._id,

  pickup: document.getElementById("pickup").value,
  drop: document.getElementById("drop").value,
  date: document.getElementById("date").value,
  time: document.getElementById("time").value,
  price: document.getElementById("fareSlider").value
};

  try {
    // 3. Send the data to your NOW-RUNNING local server!
    const response = await fetch("https://motopool-backend.onrender.com/offer-ride", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rideData)
    });

    if (response.ok) {
      // 4. If the server says "Success", redirect using the URL parameters!
      const queryParams = new URLSearchParams(rideData).toString();
      window.location.href = `success.html?${queryParams}`;
    } else {
      alert("Oops! The server rejected the ride.");
    }
  } catch (error) {
    console.error("Server error:", error);
    alert("Could not connect to the server. Make sure your Node terminal is running!");
  }
}

async function loadRides(){

  const rideCards =
  document.getElementById("rideCards");

  if(!rideCards) return;

  const pickup =
  document.getElementById("searchPickup")?.value.trim();

  const drop =
  document.getElementById("searchDrop")?.value.trim();

  const user =
  JSON.parse(localStorage.getItem("user"));

  const params =
  new URLSearchParams();

  if(pickup){
    params.set("pickup", pickup);
  }

  if(drop){
    params.set("drop", drop);
  }

  if(user && user._id){
    params.set("userId", user._id);
  }

  const queryString =
  params.toString();

  let rides = [];

  try {

    const response = await fetch(
      `https://motopool-backend.onrender.com/rides${queryString ? `?${queryString}` : ""}`
    );

    rides = await response.json();

  } catch (error) {

    rideCards.innerHTML = `
      <div class="empty-state">
        <h3>Could not load rides</h3>
        <p>Make sure your backend server is running.</p>
      </div>
    `;

    return;

  }

  rideCards.innerHTML = "";

  if(rides.length === 0){

    rideCards.innerHTML = `
      <div class="empty-state">
        <h3>No rides found</h3>
        <p>Try another pickup or drop location.</p>
      </div>
    `;

    return;
  }

  // Filter out full rides
  const availableRides = rides.filter(ride => Number(ride.joinedCount || 0) < 1);

  if(availableRides.length === 0){

    rideCards.innerHTML = `
      <div class="empty-state">
        <h3>No available rides</h3>
        <p>All rides found are full. Try another search.</p>
      </div>
    `;

    return;
  }

  availableRides.forEach((ride) => {

    const isFull =
    Number(ride.joinedCount || 0) >= 1;

    const riderName = ride.userId?.name || "Unknown Rider";
    const riderPhoto = ride.userId?.profilePhoto || "images/profile.png";
    const riderAge = ride.userId?.age || "N/A";
    const riderRating = ride.userId?.rating || 5;

    rideCards.innerHTML += `
      <div class="ride-card ride-card-find">
        <div class="ride-card-find-left">
          <h2 style="color: white; font-size: 18px; margin-bottom: 15px;">${riderName}</h2>
          <p>📍 ${ride.pickup} → ${ride.drop}</p>
          <p>📅 ${ride.date}</p>
          <p>🕒 ${ride.time}</p>
          <p>💸 ₹${ride.price}</p>
          ${
            isFull
              ? `<button class="secondary-btn" disabled>Full</button>`
              : `<button class="join-btn" onclick="joinRide('${ride._id}', '${riderName}', '${ride.pickup}', '${ride.drop}', '${ride.date}', '${ride.time}', '${ride.price}', '${ride.userId._id}', this)">Join Ride</button>`
          }
        </div>
        <div class="ride-card-find-right">
          <img src="${riderPhoto}" alt="${riderName}" class="rider-photo">
          <p class="rider-label">Rider</p>
          <p class="rider-age">Age: ${riderAge}</p>
          <p class="rider-rating">⭐ ${riderRating}</p>
        </div>
      </div>
    `;
  });

}

async function joinRide(rideId, riderName, pickup, drop, date, time, price, riderId, button){

  const user =
  JSON.parse(localStorage.getItem("user"));

  if(!user){

    window.location.href = "login.html";
    return;

  }

  try {

    const response = await fetch("https://motopool-backend.onrender.com/join-ride", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rideId,
        userId: user._id
      })
    });

    const data = await response.json();

    if(response.ok){
      // Redirect to join success page with ride details
      const queryParams = new URLSearchParams({
        riderName,
        pickup,
        drop,
        date,
        time,
        price,
        riderId
      }).toString();
      window.location.href =
      `inbox.html?conversationId=${data.conversation._id}&rideId=${rideId}`;
    } else {
      alert(data.message || "Could not join this ride");
    }

  } catch (error) {

    alert("Could not join this ride. Make sure your backend server is running.");

  }

}

if(document.getElementById("rideCards")){
  loadRides();
}

const rideSearchForm =
document.getElementById("rideSearchForm");

if(rideSearchForm){

  rideSearchForm.addEventListener("submit", (event) => {

    event.preventDefault();

    loadRides();

  });

}

const clearSearchBtn =
document.getElementById("clearSearchBtn");

if(clearSearchBtn){

  clearSearchBtn.addEventListener("click", () => {

    document.getElementById("searchPickup").value = "";
    document.getElementById("searchDrop").value = "";

    loadRides();

  });

}

const fareSlider =

document.getElementById("fareSlider");

const fareValue =

document.getElementById("fareValue");

if(fareSlider){

  fareSlider.oninput = function(){

    fareValue.textContent = this.value;

  };

}

// --- SUCCESS PAGE LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const successBox = document.querySelector(".success-box");

  if (successBox) {
    // 1. Safely Fire Confetti
    if (typeof confetti === "function") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffb000', '#ff8800', '#ffffff']
      });
    }

    // 2. Load Details from URL
    const params = new URLSearchParams(window.location.search);
    const summaryCard = document.getElementById("rideSummary");

    if (params.has("pickup") && summaryCard) {
      summaryCard.innerHTML = `
        <p>📍 <span>Route:</span> ${params.get("pickup")} → ${params.get("drop")}</p>
        <p>📅 <span>When:</span> ${params.get("date")} at ${params.get("time")}</p>
        <p>💸 <span>Fare:</span> ₹${params.get("price")}</p>
      `;
      summaryCard.style.display = "block"; // Force it to show
    }

    // 3. Share Button Logic
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareData = {
          title: 'MotoPool Ride',
          text: `I'm driving from ${params.get("pickup")} to ${params.get("drop")} on ${params.get("date")}. Join me on MotoPool!`,
          url: window.location.origin
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            navigator.clipboard.writeText(shareData.text);
            shareBtn.textContent = "✅ Copied!";
            setTimeout(() => shareBtn.textContent = "📤 Share", 3000);
          }
        } catch (err) {
          console.error("Error sharing:", err);
        }
      });
    }

    // 4. Edit Button Logic
    const editBtn = document.getElementById("editBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        window.location.href = "offer.html";
      });
    }
  }
});

// Store all rides for filtering
let allUserRides = {
  offered: [],
  joined: []
};

async function loadUserRides() {

  const user =
  JSON.parse(localStorage.getItem("user"));

  const response = await fetch(
    `https://motopool-backend.onrender.com/my-all-rides/${user._id}`
  );

  const data = await response.json();
  allUserRides.offered = data.offered || [];
  allUserRides.joined = data.joined || [];

  const rideCount =
  document.getElementById("rideCount");

  const totalEarned =
  document.getElementById("totalEarned");

  // Calculate stats only from posted rides
  const completedPostedRides =
  allUserRides.offered.filter((ride) => {
    return getRideStatus(ride).label === "Live" && Number(ride.joinedCount || 0) > 0;
  });

  if(rideCount){
    rideCount.textContent = completedPostedRides.length;
  }

  if(totalEarned){

    const earned = completedPostedRides.reduce((total, ride) => {
      return total + (Number(ride.price || 0) * Number(ride.joinedCount || 0));
    }, 0);

    totalEarned.textContent = `₹${earned}`;

  }

  // Show all rides initially
  displayRides("all");
}

function filterRides(type) {
  // Update button active states
  document.getElementById("filterAll").classList.toggle("active", type === "all");
  document.getElementById("filterPosted").classList.toggle("active", type === "posted");
  document.getElementById("filterJoined").classList.toggle("active", type === "joined");

  displayRides(type);
}

function displayRides(filterType) {
  const rideList = document.getElementById("rideList");
  rideList.innerHTML = "";

  let ridesToShow = [];

  if(filterType === "posted") {
    ridesToShow = allUserRides.offered;
  } else if(filterType === "joined") {
    ridesToShow = allUserRides.joined;
  } else {
    ridesToShow = [...allUserRides.offered, ...allUserRides.joined];
  }

  // Sort by date/time
  ridesToShow.sort(compareRideSchedule);

  if(ridesToShow.length === 0){
    rideList.innerHTML = `
      <div class="empty-state">
        <h3>No ${filterType !== "all" ? filterType : ""} rides</h3>
        <p>Post a ride or join an existing one to get started!</p>
      </div>
    `;
    return;
  }

  let html = "";

  ridesToShow.forEach((ride) => {
    const rideStatus = getRideStatus(ride);
    const isPosted = allUserRides.offered.some(r => r._id === ride._id);
    
    // Determine which user to show
    let otherUser = null;
    if(isPosted && ride.joiningUser) {
      otherUser = ride.joiningUser;
    } else if(!isPosted && ride.userId) {
      otherUser = ride.userId;
    }

    const badge = isPosted ? "🏍️ YOU'RE RIDING" : "👤 YOU JOINED";
    const badgeColor = isPosted ? "#ffb000" : "#00d4ff";

    html += `
      <div class="ride-card dashboard-card ride-card-with-profile">
        <div class="ride-card-left">
          <div class="card-header">
            <span class="status-badge ${rideStatus.className}">
              ${rideStatus.label}
            </span>
            <span class="fare-display">
              ₹${ride.price}
            </span>
          </div>

          <div class="card-body">
            <p>📍 ${ride.pickup} → ${ride.drop}</p>
            <p>📅 ${ride.date} at ${ride.time}</p>
            <p style="color: ${badgeColor}; font-weight: bold; margin-top: 8px;">${badge}</p>
          </div>

          <div class="card-footer">
            ${isPosted 
              ? `<button class="secondary-btn" onclick="openInbox('${ride._id}')">💬 Message Pillion</button>` 
              : `<button class="secondary-btn" onclick="openInbox('${ride._id}')">💬 Message Rider</button>`
            }
            <button class="danger-btn" onclick="${isPosted ? `deleteRide('${ride._id}')` : `cancelRide('${ride._id}')`}">${isPosted ? 'Delete' : 'Cancel'}</button>
          </div>
        </div>

        <div class="ride-card-right">
          ${otherUser 
            ? `
              <div class="other-user-profile">
                <div class="profile-avatar-small">
                  <img src="${otherUser.profilePhoto || 'images/profile.png'}" alt="${otherUser.name}">
                </div>
                <h4>${otherUser.name}</h4>
                <p class="user-role">${isPosted ? "Pillion" : "Rider"}</p>
              </div>
            ` 
            : `
              <div class="no-user">
                <p>Waiting for ${isPosted ? "pillion" : "rider"}</p>
              </div>
            `
          }
        </div>
      </div>
    `;
  });

  rideList.innerHTML = html;
}

function getRideStatus(ride){

  const rideTimestamp =
  getRideTimestamp(ride);

  if(rideTimestamp === Infinity){

    return {
      label: "Upcoming",
      className: "upcoming"
    };

  }

  if(rideTimestamp <= Date.now()){

    return {
      label: "Live",
      className: "live"
    };

  }

  return {
    label: "Upcoming",
    className: "upcoming"
  };

}

function compareRideSchedule(firstRide, secondRide){

  return getRideTimestamp(firstRide) - getRideTimestamp(secondRide);

}

function getRideTimestamp(ride){

  const rideDateTime =
  new Date(`${ride.date}T${ride.time || "00:00"}`);

  if(!ride.date || Number.isNaN(rideDateTime.getTime())){
    return Infinity;
  }

  return rideDateTime.getTime();

}

// Run this when the profile page loads
if (document.getElementById("rideList")) {
  loadUserRides();

  setInterval(loadUserRides, 60000);
}


async function deleteRide(id){

  await fetch(
    `https://motopool-backend.onrender.com/ride/${id}`,
    {
      method:"DELETE"
    }
  );

  loadUserRides();

}

async function cancelRide(rideId) {

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const response = await fetch("https://motopool-backend.onrender.com/cancel-ride", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rideId,
        userId: user._id
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Ride cancelled successfully!");
      loadUserRides();
    } else {
      alert(data.message || "Could not cancel ride");
    }

  } catch (error) {

    alert("Error cancelling ride: " + error.message);

  }

}

async function openInbox(rideId) {

    try {

        const response =
        await fetch(
            `https://motopool-backend.onrender.com/conversation-by-ride/${rideId}`
        );

        const conversation =
        await response.json();

        window.location.href =
        `inbox.html?conversationId=${conversation._id}&rideId=${rideId}`;

    } catch (error) {

        alert("Conversation not found");

    }

}



document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn =
  document.getElementById("logoutBtn");

  if(logoutBtn){

    logoutBtn.addEventListener("click", () => {

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      window.location.href = "login.html";

    });

  }

});
