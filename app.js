const SUPABASE_URL =
  "https://ywaicpfgqejwfwkvetyj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TVwTkLYOgFadiLVpfvZ5sQ_qZoFZoGU";


/* =========================
   CONNECT SUPABASE
========================= */

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   ELEMENTS
========================= */

const codeInput =
  document.getElementById("code");

const searchButton =
  document.getElementById("searchButton");

const result =
  document.getElementById("result");


/* =========================
   SEARCH BUTTON
========================= */

searchButton.addEventListener(
  "click",
  function () {
    findJob();
  }
);


/* =========================
   ENTER KEY
========================= */

codeInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {
      findJob();
    }

  }
);


/* =========================
   FIND JOB
========================= */

async function findJob() {

  const code =
    codeInput.value.trim();


  if (!code) {

    result.innerHTML = `
      <div
        class="card"
        style="color:#222222;"
      >

        <h3>⚠️ กรุณากรอกรหัสงาน</h3>

        <p>
          ตัวอย่างเช่น
          <b>001</b>
        </p>

      </div>
    `;

    return;
  }


  result.innerHTML = `
    <div
      class="card"
      style="color:#222222;"
    >

      🔄 กำลังค้นหางาน
      <b>${escapeHtml(code)}</b>...

    </div>
  `;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("jobs")
        .select(
          "id,code,title,status,progress,message,view_url,created_at,updated_at"
        )
        .eq("code", code)
        .maybeSingle();


    if (error) {

      console.error(
        "Supabase error:",
        error
      );


      result.innerHTML = `
        <div
          class="card"
          style="color:#222222;"
        >

          <h3>❌ เกิดข้อผิดพลาด</h3>

          <p>
            ${escapeHtml(
              error.message
            )}
          </p>

        </div>
      `;

      return;
    }


    if (!data) {

      result.innerHTML = `
        <div
          class="card"
          style="color:#222222;"
        >

          <h3>❌ ไม่พบงาน</h3>

          <p>
            ไม่พบรหัสงาน
            <b>${escapeHtml(code)}</b>
          </p>

        </div>
      `;

      return;
    }


    showJob(data);

  }

  catch (error) {

    console.error(error);


    result.innerHTML = `
      <div
        class="card"
        style="color:#222222;"
      >

        <h3>❌ ไม่สามารถโหลดงานได้</h3>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>
    `;

  }

}


/* =========================
   SHOW JOB
========================= */

function showJob(job) {

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        Number(job.progress) || 0
      )
    );


  let imageHTML = "";


  if (job.view_url) {

    imageHTML = `

      <div
        style="
          margin-top:20px;
        "
      >

        <img
          src="${escapeAttribute(
            job.view_url
          )}"
          alt="รูปงาน"
          style="
            width:100%;
            max-width:700px;
            display:block;
            margin:auto;
            border-radius:15px;
          "
        >

      </div>

    `;

  }


  const message =
    job.message &&
    String(job.message).trim()
      ? job.message
      : "ยังไม่มีข้อความจากแอดมิน";


  result.innerHTML = `

    <div
      class="card"
      style="
        color:#222222;
      "
    >

      <!-- TITLE -->

      <h2
        style="
          color:#111111;
        "
      >
        ${escapeHtml(
          job.title
        )}
      </h2>


      <!-- CODE -->

      <p
        style="
          color:#222222;
        "
      >

        รหัสงาน:
        <b>
          ${escapeHtml(
            job.code
          )}
        </b>

      </p>


      <!-- STATUS -->

      <p
        style="
          color:#222222;
        "
      >

        สถานะ:
        <b>
          ${getStatus(
            job.status
          )}
        </b>

      </p>


      <!-- PROGRESS -->

      <p
        style="
          color:#222222;
        "
      >

        ความคืบหน้า:
        <b>
          ${progress}%
        </b>

      </p>


      <!-- PROGRESS BAR -->

      <div
        style="
          width:100%;
          height:14px;
          background:#e5e7eb;
          border-radius:20px;
          overflow:hidden;
          margin:10px 0 20px;
        "
      >

        <div
          style="
            width:${progress}%;
            height:100%;
            background:#4da6ff;
            border-radius:20px;
            transition:width .4s ease;
          "
        ></div>

      </div>


      <!-- ADMIN MESSAGE -->

      <div
        style="
          margin-top:20px;
          padding:18px;
          background:#f5f8fc;
          color:#222222;
          border-radius:15px;
          border:1px solid #dfe5ec;
        "
      >

        <div
          style="
            font-weight:bold;
            font-size:17px;
            margin-bottom:10px;
            color:#111111;
          "
        >
          📝 ข้อความจากแอดมิน
        </div>


        <div
          style="
            white-space:pre-wrap;
            word-break:break-word;
            line-height:1.7;
            color:#222222;
            font-size:15px;
          "
        >
          ${escapeHtml(
            message
          )}
        </div>

      </div>


      <!-- IMAGE -->

      ${imageHTML}


      <!-- UPDATED -->

      <p
        style="
          margin-top:18px;
          color:#666666;
          font-size:13px;
        "
      >

        🕐 อัปเดตล่าสุด:
        ${formatDate(
          job.updated_at
        )}

      </p>

    </div>

  `;

}


/* =========================
   STATUS
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
   DATE
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
          dateStyle:
            "medium",

          timeStyle:
            "short"
        }
      );

  }

  catch {

    return "-";

  }

}


/* =========================
   ESCAPE HTML
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


/* =========================
   ESCAPE ATTRIBUTE
========================= */

function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================
   REAL-TIME
========================= */

supabaseClient

  .channel(
    "customer-job-realtime"
  )

  .on(

    "postgres_changes",

    {
      event: "*",
      schema: "public",
      table: "jobs"
    },

    function (payload) {

      console.log(
        "Job updated:",
        payload
      );


      const currentCode =
        codeInput.value.trim();


      if (!currentCode) {
        return;
      }


      /* งานถูกลบ */

      if (
        payload.eventType ===
        "DELETE"
      ) {

        if (
          payload.old &&
          String(
            payload.old.code
          ) === String(
            currentCode
          )
        ) {

          result.innerHTML = `

            <div
              class="card"
              style="
                color:#222222;
              "
            >

              <h3>
                🗑️ งานนี้ถูกลบแล้ว
              </h3>

              <p>
                ไม่พบข้อมูลงาน
                <b>
                  ${escapeHtml(
                    currentCode
                  )}
                </b>
              </p>

            </div>

          `;

        }

        return;
      }


      /* ตรวจเฉพาะงานที่กำลังดู */

      if (
        payload.new &&
        payload.new.code &&
        String(
          payload.new.code
        ) !== String(
          currentCode
        )
      ) {

        return;

      }


      /* โหลดข้อมูลใหม่ */

      findJob();

    }

  )

  .subscribe(
    function (status) {

      console.log(
        "Realtime status:",
        status
      );

    }
  );
