const SUPABASE_URL =
  "https://ywaicpfgqejwfwkvetyj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TVwTkLYOgFadiLVpfvZ5sQ_qZoFZoGU";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// =========================
// ค้นหางาน
// =========================

async function findJob() {

  const code =
    document
      .getElementById("code")
      .value
      .trim();

  const result =
    document.getElementById("result");


  if (!code) {

    result.innerHTML =
      "กรุณากรอกรหัสงาน";

    return;
  }


  result.innerHTML =
    "กำลังค้นหา...";


  const { data, error } =
    await supabaseClient
      .from("jobs")
      .select("*")
      .eq("code", code)
      .maybeSingle();


  if (error) {

    console.error(error);

    result.innerHTML =
      "❌ ไม่สามารถค้นหางานได้";

    return;
  }


  if (!data) {

    result.innerHTML =
      "❌ ไม่พบรหัสงานนี้";

    return;
  }


  showJob(data);
}


// =========================
// แสดงงาน
// =========================

function showJob(job) {

  const result =
    document.getElementById("result");


  let image = "";


  if (job.view_url) {

    image = `

      <img
        src="${job.view_url}"
        alt="รูปงาน"
        style="
          width:100%;
          max-width:700px;
          border-radius:15px;
          margin-top:15px;
        "
      >

    `;
  }


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
        ${getStatus(job.status)}
      </p>

      <p>
        ความคืบหน้า:
        ${job.progress}%
      </p>

      <div
        style="
          width:100%;
          background:#eee;
          height:12px;
          border-radius:20px;
          overflow:hidden;
        "
      >

        <div
          style="
            width:${job.progress}%;
            height:100%;
            background:#4da6ff;
          "
        ></div>

      </div>

      <p>
        ${escapeHtml(job.message || "")}
      </p>

      ${image}

      <small>
        อัปเดตล่าสุด:
        ${formatDate(job.updated_at)}
      </small>

    </div>

  `;
}


// =========================
// สถานะ
// =========================

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
    status
  );
}


// =========================
// วันที่
// =========================

function formatDate(date) {

  if (!date) return "-";


  return new Date(date)
    .toLocaleString(
      "th-TH",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );
}


// =========================
// ป้องกัน HTML
// =========================

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


// =========================
// REAL-TIME
// =========================

supabaseClient
  .channel("jobs-realtime")

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "jobs"
    },
    () => {

      const code =
        document
          .getElementById("code")
          .value
          .trim();


      if (code) {
        findJob();
      }

    }
  )

  .subscribe();
