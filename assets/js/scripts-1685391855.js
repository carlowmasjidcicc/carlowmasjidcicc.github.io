(function () {
  "use strict";

  const getToday = () => {
    return new Date();
  };

  const addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isToday = (someDate) => {
    var today = getToday();
    return (
      someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
    );
  };

  const getAssetName = (date, format) => {
    const month = date
      .toLocaleDateString("default", { month: "short" })
      .toUpperCase();
    const year = date.getFullYear();
    return `assets/${format}/${month}${year}.${format}`;
  };

  const setFooterYear = () => {
    const year = getToday().getFullYear();
    document.getElementById("footer-year").innerHTML = year;
    console.log(`Footer year set to ${year}`);
  };

  const setSalahTimeUrl = () => {
    try {
      const asset = getAssetName(addDays(getToday(), 3), `pdf`);
      // const asset = `assets/pdf/Ramadan2023.pdf`;
      document.getElementById("salah-times").href = asset;
      document.getElementById("salah-times-footer").href = asset;
      if (window.location.href.endsWith(`/`)) {
        document.getElementById("salah-times-body").href = asset;
      }
    } catch (error) {
      console.error(`Error loading salah times ${error}`);
    }
  };

  const setSalahTimes = () => {
    var xmlhttp = new XMLHttpRequest();
    var today = getToday();
    var addedDays = addDays(today, 3);
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        if (window.location.href.endsWith(`/`)) {
          document.getElementById("fajr").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].fajarTime.toLowerCase();
          document.getElementById("sunrise").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].sunriseTime.toLowerCase();
          document.getElementById("dhuhr").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].dhuharTime.toLowerCase();
          document.getElementById("asr").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].asrTime.toLowerCase();
          document.getElementById("maghrib").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].maghribTime.toLowerCase();
          document.getElementById("isha").innerHTML =
            myObj.dailyPrayers[today.getDate() - 1].ishaTime.toLowerCase();
          document.getElementById("cur-month").innerHTML =
            addedDays.toLocaleString("default", { month: "long" });
          // document.getElementById("cur-month").innerHTML = "Ramadan";
        }
        document.getElementById("nav-hijri").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].hijriDate;
        document.getElementById("nav-cur-month").innerHTML =
          addedDays.toLocaleString("default", { month: "long" });
        document.getElementById("footer-cur-month").innerHTML =
          addedDays.toLocaleString("default", { month: "long" });
        // document.getElementById("nav-cur-month").innerHTML = "Ramadan";
        // document.getElementById("footer-cur-month").innerHTML = "Ramadan";

        document.getElementById("nav-fajr-begins").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].fajarTime.toLowerCase();
        document.getElementById("nav-fajr-jamaat").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].fajarJamahTime.toLowerCase();

        document.getElementById("nav-sunrise").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].sunriseTime.toLowerCase();

        document.getElementById("nav-zohr-begins").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].dhuharTime.toLowerCase();
        document.getElementById("nav-zohr-jamaat").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].zohrJamahTime.toLowerCase();

        document.getElementById("nav-asar-begins").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].asrTime.toLowerCase();
        document.getElementById("nav-asar-jamaat").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].asarJamahTime.toLowerCase();

        document.getElementById("nav-magrib-begins").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].maghribTime.toLowerCase();
        document.getElementById("nav-magrib-jamaat").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].magribJamahTime.toLowerCase();

        document.getElementById("nav-isha-begins").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].ishaTime.toLowerCase();
        document.getElementById("nav-isha-jamaat").innerHTML =
          myObj.dailyPrayers[today.getDate() - 1].ishaJamahTime.toLowerCase();
      }
    };
    var asset = getAssetName(getToday(), `json`);
    console.log(asset);
    xmlhttp.open("GET", asset, true);
    xmlhttp.send();
  };

  const showWhatsAppButton = () => {
    var url =
      "https://wati-integration-service.clare.ai/ShopifyWidget/shopifyWidget.js?69866";
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = url;
    var options = {
      enabled: true,
      chatButtonSetting: {
        backgroundColor: "#024b3a",
        ctaText: "",
        borderRadius: "25",
        marginLeft: "0",
        marginBottom: "100",
        marginRight: "20",
        position: "right",
      },
      brandSetting: {
        brandName: "Carlow Masjid",
        brandSubTitle: "Carlow Islamic Cultural Centre",
        brandImg: "https://carlowmasjid.ie/assets/images/logo.png",
        welcomeText: "As-salamu alaikum! How may I help you?",
        backgroundColor: "#595FB0",
        ctaText: "Start Chat",
        borderRadius: "25",
        autoShow: false,
        phoneNumber: "353894567493",
      },
    };
    s.onload = function () {
      CreateWhatsappChatWidget(options);
    };
    var x = document.getElementsByTagName("script")[0];
    x.parentNode.insertBefore(s, x);
  };

  const pillarsOfFaith = () => {
    let i = 2;
    $(document).ready(function () {
      var radius = 200;
      var fields = $(".itemDot");
      var container = $(".dotCircle");
      var width = container.width();
      radius = width / 2.5;
      var height = container.height();
      var angle = 0,
        step = (2 * Math.PI) / fields.length;
      fields.each(function () {
        var x = Math.round(
          width / 2 + radius * Math.cos(angle) - $(this).width() / 2
        );
        var y = Math.round(
          height / 2 + radius * Math.sin(angle) - $(this).height() / 2
        );
        // if (window.console) {
        //   console.log($(this).text(), x, y);
        // }
        $(this).css({
          left: x + "px",
          top: y + "px",
        });
        angle += step;
      });

      $(".itemDot").click(function () {
        var dataTab = $(this).data("tab");
        $(".itemDot").removeClass("active");
        $(this).addClass("active");
        $(".CirItem").removeClass("active");
        $(".CirItem" + dataTab).addClass("active");
        i = dataTab;
        $(".dotCircle").css({
          transform: "rotate(" + (360 - (i - 1) * 36) + "deg)",
          transition: "2s",
        });
        $(".itemDot").css({
          transform: "rotate(" + (i - 1) * 36 + "deg)",
          transition: "1s",
        });
      });
      setInterval(function () {
        var dataTab = $(".itemDot.active").data("tab");
        if (dataTab > 6 || i > 6) {
          dataTab = 1;
          i = 1;
        }
        $(".itemDot").removeClass("active");
        $('[data-tab="' + i + '"]').addClass("active");
        $(".CirItem").removeClass("active");
        $(".CirItem" + i).addClass("active");
        i++;

        $(".dotCircle").css({
          transform: "rotate(" + (360 - (i - 2) * 36) + "deg)",
          transition: "2s",
        });
        $(".itemDot").css({
          transform: "rotate(" + (i - 2) * 36 + "deg)",
          transition: "1s",
        });
      }, 10000);
    });
  };

  const showCookiePolicy = () => {
    $("#cookie-accept").click(function () {
      Cookies.set("cicc-accept-cookie", true, { expires: 10 });
    });

    if (
      Cookies.get("cicc-accept-cookie") === undefined ||
      Cookies.get("cicc-accept-cookie") === "false"
    ) {
      $("#cookie-bar").toggleClass("show");
      // $("#cookie-bar").show();
    } else {
      $("#cookie-bar").hide();
    }
  };

  const getHadithTitle = (key) => {
    const hadithCollectionMap = new Map();
    const collections = [
      "bukhari",
      "muslim",
      "nasai",
      "abudawud",
      "tirmidhi",
      "ibnmajah",
      "riyadussalihin",
    ];
    const titles = [
      "Sahih al-Bukhari",
      "Sahih Muslim",
      "Sunan an-Nasa'i",
      "Sunan Abi Dawud",
      "Jami` at-Tirmidhi",
      "Sunan Ibn Majah",
      "Riyad as-Salihin",
    ];

    for (let i = 0; i < collections.length; i++) {
      hadithCollectionMap.set(collections[i], titles[i]);
    }

    return hadithCollectionMap.get(key);
  };

  const getRandomHadith = () => {
    try {
      var xhr = new XMLHttpRequest();

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE && this.status === 200) {
          const randomHadith = JSON.parse(this.responseText);
          console.log(randomHadith);

          document.getElementById("hadith-body").innerHTML =
            randomHadith.hadith.body;
          document.getElementById("hadith-cite").innerHTML = `${getHadithTitle(
            randomHadith.collection
          )} ${randomHadith.hadith.chapterNumber}:${randomHadith.hadithNumber}`;
          document.getElementById(
            "hadith-link"
          ).href = `https://sunnah.com/${randomHadith.collection}:${randomHadith.hadithNumber}`;
        }
      });

      xhr.open(
        "GET",
        "https://europe-west1-carlow-masjid.cloudfunctions.net/randomHadith"
      );
      xhr.send();
    } catch {
      document.getElementById("hadith-body").innerHTML =
        "<p>Abu Hurairah (May Allah be pleased with him) reported: Messenger of Allah (ﷺ) said, \"The five (daily) Salat (prayers), and from one Jumu'ah prayer to the (next) Jumu'ah prayer, and from Ramadan to Ramadan are expiations for the (sins) committed in between (their intervals); provided the major sins are not committed\".<br/><br/><b>[Muslim]</b>.<br/><br/></p>";
      document.getElementById("hadith-cite").innerHTML =
        "Riyad as-Salihin 189:1059";
      document.getElementById(
        "hadith-link"
      ).href = `https://sunnah.com/riyadussalihin:1059`;
    }
  };

  window.onload = () => {
    setFooterYear();
    setSalahTimeUrl();
    setSalahTimes();
    showCookiePolicy();

    if (window.location.href.endsWith(`/`)) {
      pillarsOfFaith();
    }
    showWhatsAppButton();
    getRandomHadith();
  };
})();
