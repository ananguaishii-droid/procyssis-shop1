const SUPABASE_URL =
  "https://ywaicpfgqejwfwkvetyj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TVwTkLYOgFadiLVpfvZ5sQ_qZoFZoGU";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


const codeInput =
  document.getElementById("code");

const searchButton =
  document.getElementById("searchButton");

const result =
  document.getElementById("result");


/* =========================
   ปุ่มค้นหางาน
========================= */

searchButton.addEventListener(
  "click",
  findJob
);


codeInput.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {
      findJob();
    }

  }
);


/* =========================
   ค้นหางาน
========================= */

async function findJob() {

  const code =
    codeInput.value.trim();


  if (!code) {

    result.innerHTML = `
      <div class="card">
        ❌ กรุณากรอกรหัสงาน
      </div>
    `;

    return;
  }


  result.innerHTML = `
    <div class="card">
      🔄 กำลังค้นหารหัสงาน
      <b>${escapeHtml(code)}</b>...
    </div>
  `;


  try {

    const response =
      await supabaseClient
        .from("jobs")
        .select("*")
        .eq("code", code)
        .maybeSingle();


    const data =
      response.data;

    const error =
      response.error;


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      result.innerHTML = `
        <div class="card">
          ❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล
          <br><br>
          ${escapeHtml(error.message)}
        </div>
      `;

      return;
    }


    if (!data) {

      result.innerHTML = `
        <div class="card">
          ❌ ไม่พบรหัสงาน
          <br><br>
          <b>${escapeHtml(code)}</b>
        </div>
      `;

      return;
    }


    showJob(data);

  }

  catch (error) {

    console.error(error);

    result.innerHTML = `
      <div class="card">
        ❌ เกิดข้อผิดพลาด
        <br><br>
        ${escapeHtml(error.message)}
      </div>
    `;

  }

}


/* =========================
   แสดงข้อมูลงาน
========================= */

function showJob(job) {

  let image = "";


  if (job.view_url) {

    image = `
      <img
        src="${escapeAttribute(job.view_url)}"
        alt="รูปงาน"
        style="
          width:100%;
          max-width:700px;
          display:block;
          margin:18px auto 0;
          border-radius:15px;
        "
      >
    `;

  }


  const progress =
    Math.max(
      0,
      Math.min(
        100,
        Number(job.progress) || 0
      )
    );


  result.innerHTML = `

    <div class="card">

      <h2>
        ${escapeHtml(job.title)}
      </h2>


      <p>
        รหัสงาน:
        <b>${escapeHtml(job.code)}</b>
      </p>


      <p>
        สถานะ:
        <b>${getStatus(job.status)}</b>
      </p>


      <p>
        ความคืบหน้า:
        <b>${progress}%</b>
      </p>


      <div
        style="
          width:100%;
          height:14px;
          background:#e5e7eb;
          border-radius:20px;
          overflow:hidden;
          margin:12px 0;
        "
      >

        <div
          style="
            width:${progress}%;
            height:100%;
            background:#4da6ff;
            border-radius:20px;
            transition:width .4s;
          "
        ></div>

      </div>


      <div
        style="
          background:#f5f8fc;
          padding:15px;
          border-radius:12px;
          margin-top:15px;
        "
      >

        ${escapeHtml(job.message || "ไม่มีข้อความ")}

      </div>


      ${image}


      <p style="margin-top:15px;opacity:.7;">

        🕐 อัปเดตล่าสุด:
        ${formatDate(job.updated_at)}

      </p>

    </div>

  `;

}


/* =========================
   สถานะงาน
========================= */

function getStatus(status) {

  const statusMap = {

    working:
      "🟢 กำลังทำงาน",

    waiting:
      "🟡 รอคิว",

    paused:
      "🟠 พักงาน",

    done:
      "🔵 เสร็จแล้ว"

  };


  return (
    statusMap[status] ||
    status ||
    "ไม่ทราบสถานะ"
  );

}


/* =========================
   เวลา
========================= */

function formatDate(date) {

  if (!date) {
    return "-";
  }


  try {

    return new Date(date)
      .toLocaleString(
        "th-TH",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

  }

  catch {

    return date;

  }

}


/* =========================
   ป้องกัน HTML แปลก ๆ
========================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================
   Real-time
========================= */

supabaseClient

  .channel("jobs-realtime")

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "jobs"
    },

    function(payload) {

      console.log(
        "Real-time update:",
        payload
      );


      const currentCode =
        codeInput.value.trim();


      if (!currentCode) {
        return;
      }


      /*
       * โหลดข้อมูลใหม่ทันที
       */

      findJob();

    }
  )

  .subscribe(
    function(status) {

      console.log(
        "Realtime:",
        status
      );

    }
  );
