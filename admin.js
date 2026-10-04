const SUPABASE_URL =
  "https://ywaicpfgqejwfwkvetyj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TVwTkLYOgFadiLVpfvZ5sQ_qZoFZoGU";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let currentUser = null;


// =========================
// LOGIN
// =========================

async function login() {

  const email =
    document
      .getElementById("email")
      .value
      .trim();

  const password =
    document
      .getElementById("password")
      .value;

  const msg =
    document.getElementById("loginMsg");

  if (!email || !password) {

    msg.textContent =
      "กรุณากรอกอีเมลและรหัสผ่าน";

    return;
  }


  msg.textContent =
    "กำลังเข้าสู่ระบบ...";


  const { data, error } =
    await supabaseClient.auth
      .signInWithPassword({

        email: email,
        password: password

      });


  if (error) {

    console.error(error);

    msg.textContent =
      "เข้าสู่ระบบไม่สำเร็จ: " +
      error.message;

    return;
  }


  currentUser = data.user;


  document
    .getElementById("loginBox")
    .style.display = "none";


  document
    .getElementById("adminPanel")
    .style.display = "block";


  msg.textContent = "";


  loadJobs();
}


// =========================
// LOGOUT
// =========================

async function logout() {

  await supabaseClient.auth.signOut();

  currentUser = null;


  document
    .getElementById("adminPanel")
    .style.display = "none";


  document
    .getElementById("loginBox")
    .style.display = "block";


  document
    .getElementById("email")
    .value = "";


  document
    .getElementById("password")
    .value = "";
}


// =========================
// CHECK LOGIN
// =========================

async function checkLogin() {

  const { data, error } =
    await supabaseClient.auth
      .getSession();


  if (error) {

    console.error(error);

    return;
  }


  if (data.session) {

    currentUser =
      data.session.user;


    document
      .getElementById("loginBox")
      .style.display = "none";


    document
      .getElementById("adminPanel")
      .style.display = "block";


    loadJobs();
  }
}


// =========================
// IMAGE PREVIEW
// =========================

document
  .getElementById("imageFile")
  .addEventListener(
    "change",
    function () {

      const file =
        this.files[0];

      const preview =
        document.getElementById(
          "imagePreview"
        );


      if (!file) {

        preview.innerHTML = "";

        return;
      }


      const url =
        URL.createObjectURL(file);


      preview.innerHTML = `

        <img
          src="${url}"
          style="
            max-width:100%;
            max-height:300px;
            border-radius:12px;
            margin-top:10px;
          ">

      `;
    }
  );


// =========================
// UPLOAD IMAGE
// =========================

async function uploadImage(
  file,
  code
) {

  if (!file) {

    return null;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const fileName =
    "jobs/" +
    code +
    "-" +
    Date.now() +
    "." +
    extension;


  const { error } =
    await supabaseClient
      .storage
      .from("job-images")
      .upload(
        fileName,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


  if (error) {

    throw error;
  }


  const { data } =
    supabaseClient
      .storage
      .from("job-images")
      .getPublicUrl(
        fileName
      );


  return data.publicUrl;
}


// =========================
// SAVE JOB
// =========================

async function saveJob() {

  const msg =
    document.getElementById("msg");


  try {

    if (!currentUser) {

      msg.textContent =
        "กรุณาเข้าสู่ระบบก่อน";

      return;
    }


    const code =
      document
        .getElementById("fcode")
        .value
        .trim();


    const title =
      document
        .getElementById("ftitle")
        .value
        .trim();


    const status =
      document
        .getElementById("fstatus")
        .value;


    const progress =
      Number(
        document
          .getElementById("fprogress")
          .value
      );


    const message =
      document
        .getElementById("fmessage")
        .value
        .trim();


    const file =
      document
        .getElementById("imageFile")
        .files[0];


    if (!code || !title) {

      msg.textContent =
        "กรุณากรอกรหัสงานและชื่องาน";

      return;
    }


    msg.textContent =
      "กำลังบันทึก...";


    let imageUrl = null;


    if (file) {

      msg.textContent =
        "กำลังอัปโหลดรูป...";


      imageUrl =
        await uploadImage(
          file,
          code
        );
    }


    const { error } =
      await supabaseClient
        .from("jobs")
        .upsert(

          {
            code: code,
            title: title,
            status: status,
            progress: progress,
            message: message,
            view_url: imageUrl,
            updated_at:
              new Date().toISOString()
          },

          {
            onConflict: "code"
          }

        );


    if (error) {

      throw error;
    }


    msg.textContent =
      "✅ บันทึกงานเรียบร้อย";


    clearForm();

    loadJobs();


  } catch (error) {

    console.error(error);

    msg.textContent =
      "❌ เกิดข้อผิดพลาด: " +
      error.message;
  }
}


// =========================
// LOAD JOBS
// =========================

async function loadJobs() {

  const list =
    document.getElementById("list");


  list.innerHTML =
    "กำลังโหลด...";


  const { data, error } =
    await supabaseClient
      .from("jobs")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    list.innerHTML =
      "❌ โหลดข้อมูลไม่สำเร็จ: " +
      error.message;

    return;
  }


  if (!data || data.length === 0) {

    list.innerHTML =
      "ยังไม่มีงาน";

    return;
  }


  list.innerHTML =
    data
      .map(function (job) {

        return `

          <div
            class="card"
            style="margin-top:15px;">

            <b>
              ${escapeHtml(job.code)}
            </b>

            <div>
              ${escapeHtml(job.title)}
            </div>

            <div>
              สถานะ:
              ${escapeHtml(job.status)}
            </div>

            <div>
              ความคืบหน้า:
              ${job.progress}%
            </div>

            <div>
              ${escapeHtml(
                job.message || ""
              )}
            </div>

            ${
              job.view_url

              ? `

                <img
                  src="${job.view_url}"
                  style="
                    max-width:100%;
                    max-height:250px;
                    margin-top:10px;
                    border-radius:10px;
                  ">

              `

              : ""
            }

          </div>

        `;
      })
      .join("");
}


// =========================
// CLEAR
// =========================

function clearForm() {

  document
    .getElementById("fcode")
    .value = "";


  document
    .getElementById("ftitle")
    .value = "";


  document
    .getElementById("fstatus")
    .value = "working";


  document
    .getElementById("fprogress")
    .value = 0;


  document
    .getElementById("fmessage")
    .value = "";


  document
    .getElementById("imageFile")
    .value = "";


  document
    .getElementById("imagePreview")
    .innerHTML = "";
}


// =========================
// ESCAPE HTML
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
// START
// =========================

checkLogin();
