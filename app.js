const SUPABASE_URL = "https://ywaicpfgqejwfwkvetyj.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_TVwTkLYOgFadiLVpfvZ5sQ_qZoFZoGU";

const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload = start;
document.head.appendChild(script);

let supabase;

async function start() {
    supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    document.getElementById("code").addEventListener("keydown", e => {
        if (e.key === "Enter") findJob();
    });
}

async function findJob() {
    const code = document.getElementById("code").value
        .trim()
        .toUpperCase();

    const result = document.getElementById("result");

    if (!code) return;

    const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("code", code)
        .maybeSingle();

    if (error) {
        result.className = "card err";
        result.innerHTML = `
            <h2>เกิดข้อผิดพลาด</h2>
            <p>${error.message}</p>
        `;
        return;
    }

    if (!data) {
        result.className = "card err";
        result.innerHTML = `
            <h2>ไม่พบงาน</h2>
            <p>ตรวจสอบรหัสงานอีกครั้ง</p>
        `;
        return;
    }

    showJob(data);

    // รับการเปลี่ยนแปลงจาก Admin แบบ Real-time
    supabase
        .channel("job-" + data.code)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "jobs",
                filter: "code=eq." + data.code
            },
            payload => {
                if (payload.new) {
                    showJob(payload.new);
                }
            }
        )
        .subscribe();
}

function showJob(j) {

    const result = document.getElementById("result");

    const status = {
        working: "🟢 กำลังทำงาน",
        waiting: "🟡 รอคิว",
        paused: "🟠 พักงาน",
        done: "🔵 เสร็จแล้ว"
    };

    let view = `
        <div class="placeholder">
            <b>ยังไม่มีภาพจาก Redfinger</b>
            <small>
                รอการเชื่อมต่อ Redfinger View
            </small>
        </div>
    `;

    if (j.view_url) {

        if (/\.(png|jpg|jpeg|webp)(\?|$)/i.test(j.view_url)) {

            view = `
                <img src="${j.view_url}">
            `;

        } else {

            view = `
                <iframe
                    src="${j.view_url}"
                    allow="autoplay; fullscreen">
                </iframe>
            `;
        }
    }

    result.className = "";

    result.innerHTML = `
        <div class="job">

            <div class="card">

                <div class="top">
                    <h2>${escapeHtml(j.title || "PROCYSIS SHOP")}</h2>
                    <span class="badge">
                        ${status[j.status] || j.status || "—"}
                    </span>
                </div>

                <small>
                    ${escapeHtml(j.code)}
                    · อัปเดต ${formatDate(j.updated_at)}
                </small>

                <div class="screen">

                    <div class="screenbar">
                        <span>● PROCYSIS LIVE VIEW</span>
                        <span>LIVE</span>
                    </div>

                    ${view}

                </div>

            </div>

            <div class="card">

                <h2>ความคืบหน้า</h2>

                <div class="bar">
                    <div style="width:${Number(j.progress) || 0}%"></div>
                </div>

                <div class="pct">
                    ${Number(j.progress) || 0}%
                </div>

                <div class="info">

                    <div>
                        <span>เริ่มงาน</span>
                        <b>${formatDate(j.created_at)}</b>
                    </div>

                    <div>
                        <span>อัปเดตล่าสุด</span>
                        <b>${formatDate(j.updated_at)}</b>
                    </div>

                </div>

                <h3>ข้อความจากทีมงาน</h3>

                <div class="message">
                    ${escapeHtml(j.message || "—")}
                </div>

            </div>

        </div>
    `;
}

function formatDate(date) {

    if (!date) return "—";

    return new Date(date).toLocaleString("th-TH", {
        dateStyle: "short",
        timeStyle: "medium"
    });
}

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
