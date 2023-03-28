// content.js

const AgendaInit = () => {
  const scrapeCalendar = () => {
    const allEvents = [];

    // Find the current week or day view in Google Calendar
    const timeGridWeek = document.querySelector('[data-period-type="week"]');
    const currentView = timeGridWeek;

    // Get all events in the current view
    let eventsList = [];

    const allDayevents = currentView.querySelectorAll(
      '[data-opens-details="true"] div[role="button"] > *:not([aria-hidden="true"])'
    );
    const events = currentView.querySelectorAll(
      '[data-opens-details="true"] > div:not([aria-hidden="true"]):not(div[role="button"])'
    );

    const dateRegex = /, [\d]{2} [a-zA-Z]* [\d]{4}$/g;
    const multiDateRegex = /, [\d]{2} – [\d]{2} [a-zA-Z]* [\d]{4}$/g;
    const monthYearRegex = /[a-zA-Z]* [\d]{4}$/g;

    allDayevents.forEach((e) => {
      raw = e.innerText;
      if (raw) {
        startTime = null;
        endTime = null;
        startDate = null;
        endDate = null;
        isMultiDay = false;

        const regexMatch = raw.match(dateRegex);
        const multiDateRegexMatch = raw.match(multiDateRegex);
        const monthYearRegexMatch = raw.match(monthYearRegex);

        if (regexMatch !== null) {
          startDate = regexMatch[0].slice(2);
        }

        if (multiDateRegexMatch !== null) {
          date = multiDateRegexMatch[0].slice(2);
          startDateDay = date.split("–")[0].trim();
          endDate = date.split("–")[1].trim();
          startDate = `${startDateDay} ${monthYearRegexMatch}`;
          isMultiDay = true;
        }

        fields = raw.split(",");
        title = fields[1].trim();

        start = startDate ? new Date(startDate) : null;
        end = endDate ? new Date(endDate) : null;

        eventsList = [
          {
            title,
            startDate,
            endDate,
            startTime,
            endTime,
            start,
            end,
            isAllDay: true,
            raw: e.innerText,
          },
          ...eventsList,
        ];
      }
    });

    events.forEach((e) => {
      raw = e.innerText;
      if (raw) {
        title = "";
        startTime = null;
        endTime = null;
        startDate = null;
        endDate = null;
        isMultiDay = false;

        const regexMatch = raw.match(dateRegex);
        const multiDateRegexMatch = raw.match(multiDateRegex);
        const monthYearRegexMatch = raw.match(monthYearRegex);

        if (regexMatch !== null) {
          startDate = regexMatch[0].slice(2);
        }

        if (multiDateRegexMatch !== null) {
          date = multiDateRegexMatch[0].slice(2);
          startDateDay = date.split("–")[0].trim();
          endDate = date.split("–")[1].trim();
          startDate = `${startDateDay} ${monthYearRegexMatch}`;
          isMultiDay = true;
        } else {
          endDate = startDate;
        }

        fields = raw.split(",");
        times = fields[0].trim().split("to");
        startTime = times[0].trim();
        endTime = times[1].trim();
        title = fields[1].trim();

        let startDateInfo = startDate.split(" ");
        startDay = startDateInfo[0];
        startMonth = months.findIndex((e) => e === startDateInfo[1]);
        startYear = startDateInfo[2];
        startDateFormat = convertTo24Hour(startTime).split(":");

        let endDateInfo = endDate.split(" ");
        endDay = endDateInfo[0];
        endMonth = months.findIndex((e) => e === endDateInfo[1]);
        endYear = endDateInfo[2];
        endDateFormat = convertTo24Hour(endTime).split(":");

        // YYYY-MM-DDTHH:mm:ss.sss
        start =
          startDate && startTime
            ? new Date(
                parseInt(startYear),
                parseInt(padWithZero(startMonth)),
                parseInt(padWithZero(startDay)),
                parseInt(padWithZero(startDateFormat[0])),
                parseInt(padWithZero(startDateFormat[1])),
                00
              )
            : null;
        end =
          endDate && endTime
            ? new Date(
                parseInt(endYear),
                parseInt(padWithZero(endMonth)),
                parseInt(padWithZero(endDay)),
                parseInt(padWithZero(endDateFormat[0])),
                parseInt(padWithZero(endDateFormat[1])),
                0
              )
            : null;

        eventsList = [
          {
            title,
            startDate,
            endDate,
            startTime,
            endTime,
            start,
            end,
            isAllDay: false,
            raw: e.innerText,
          },
          ...eventsList,
        ];
      }
    });

    return eventsList;
  };

  function padWithZero(number) {
    return number.toString().padStart(2, "0");
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const applyDateTimes = (events) => {
    return events;
  };

  const convertTo24Hour = (time) => {
    let [hours, minutes, ampm] = time
      .match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i)
      .slice(1);
    hours = parseInt(hours);
    if (ampm === "pm" && hours !== 12) {
      hours += 12;
    } else if (ampm === "am" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes || "00"}`;
  };

  const groupByStartDate = (obj) => {
    const groupedObj = obj.reduce((acc, event) => {
      const startDate = event.startDate;
      if (!acc[startDate]) {
        acc[startDate] = [];
      }
      acc[startDate].push(event);
      return acc;
    }, {});

    const sortedObj = {};
    Object.keys(groupedObj)
      .sort((a, b) => new Date(a) - new Date(b))
      .forEach((key) => (sortedObj[key] = groupedObj[key]));

    return sortedObj;
  };

  const formatOutput = (events) => {
    const formattedEvents = [];

    // Sort events by start time
    events.sort((a, b) => a.start - b.start);

    // Sort events so all-day events come first
    events.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return 0;
    });

    // Loop through each event and format it for the Obsidian Day Planner plugin
    let prevEndTime = null;
    events.forEach((event) => {
      const { title, startTime, endTime, isAllDay } = event;

      let entry = `${title}`;

      // Format the events
      if (isAllDay === true) {
        entry = `- **All day**: ${title}`;
      } else {
        const startTimeFormatted =
          startTime === null ? "" : convertTo24Hour(startTime);
        const endTimeFormatted =
          endTime === null ? "" : convertTo24Hour(endTime);

        entry = `- **${startTimeFormatted}-${endTimeFormatted}**: ${title}`;
      }

      formattedEvents.push(entry);

      prevEndTime = endTime;
    });

    return formattedEvents.join("\n");
  };

  const formatGroupedOutput = (groupedEvents) => {
    const formattedGroupedEvents = [];

    // Loop through each event and format it for the Obsidian Day Planner plugin
    for (const [key, value] of Object.entries(groupedEvents)) {
      let events = formatOutput(value);
      let entry = `### ${key}\n${events}\n\n`;

      formattedGroupedEvents.push(entry);
    }

    return formattedGroupedEvents.join("\n");
  };

  const downloadFile = (content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // get the events
  const events = scrapeCalendar();

  // group by day
  const groupedEvents = groupByStartDate(events);

  // Format the output
  const formattedOutput = formatGroupedOutput(groupedEvents);

  // download the output as a file
  downloadFile(formattedOutput);
};

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.includes("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: AgendaInit,
    });
  }
});
