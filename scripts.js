/* Supabase OAuth setup (v2)
 *  1. 下記を実際のプロジェクト値に差し替え
 *  2. supabase.ingとSupabaseの設定が不要なら削除
 *  3. file://は非推奨。HTTPサーバーで提供してください。
 */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ralgrpfvyxuwpxamdvei.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IRfUiJsP6yLnXnFNfzLfCQ_aRAZ_Pin";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginButton = document.getElementById("supabase-login");

let currentUser = null;

async function checkSession() {
  // ログイン無効時はcurrentUserを未設定のままにして進める
  currentUser = null;
  return;
}

// loginButton.addEventListener("click", handleOAuthLogin); // 無効化

/* 初期表示時にセッション確認 */
checkSession();

/* リダイレクト後に認証状態が変わった場合を検知 */
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    loginButton.textContent = `ログイン済み: ${session.user.email || session.user.id}`;
    loginButton.disabled = true;
    loginButton.classList.add("disabled");
  }
});

/* モーダルフォーム（過去問／講義情報） */
const modalOverlay = document.getElementById("modal-overlay");
const pastQuestionModal = document.getElementById("past-question-modal");
const lectureInfoModal = document.getElementById("lecture-info-modal");
const postPastButton = document.getElementById("post-past-question");
const postLectureButton = document.getElementById("post-lecture-info");

const pastQuestionForm = document.getElementById("past-question-form");
const lectureInfoForm = document.getElementById("lecture-info-form");

function showModal(modal) {
  modalOverlay.classList.remove("hidden");
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  modalOverlay.classList.add("hidden");
}

function closeAllModals() {
  [pastQuestionModal, lectureInfoModal].forEach((m) => m.classList.add("hidden"));
  modalOverlay.classList.add("hidden");
}

const COOLDOWN_MS = 60 * 1000;
let lastPostTimestamp = 0;

function isInCooldown() {
  return Date.now() - lastPostTimestamp < COOLDOWN_MS;
}

function setCooldown() {
  lastPostTimestamp = Date.now();
}

postPastButton.addEventListener("click", () => {
  if (isInCooldown()) {
    alert("投稿クールダウン中です。1分後に再度お試しください。");
    return;
  }
  showModal(pastQuestionModal);
});
postLectureButton.addEventListener("click", () => {
  if (isInCooldown()) {
    alert("投稿クールダウン中です。1分後に再度お試しください。");
    return;
  }
  showModal(lectureInfoModal);
});

modalOverlay.addEventListener("click", closeAllModals);

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.close);
    if (target) closeModal(target);
  });
});

pastQuestionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // ログイン機能一時停止中のため、すぐ投稿可能

  const formData = new FormData(pastQuestionForm);
  const payload = {
    course_name: formData.get("courseName")?.toString().trim(),
    past_info: formData.get("pastInfo")?.toString().trim(),
    author: formData.get("author")?.toString().trim(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseClient.from("past_questions").insert([payload]);
  if (error) {
    console.error("Supabase insert past_questions failed:", error);
    alert("過去問情報の登録中にエラーが発生しました。コンソールを確認してください。");
    return;
  }

  console.log("過去問情報投稿成功:", data);
  alert("過去問情報が登録されました。");
  setCooldown();
  pastQuestionForm.reset();
  closeModal(pastQuestionModal);
});

lectureInfoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // ログイン機能一時停止中のため、すぐ投稿可能

  const formData = new FormData(lectureInfoForm);
  const payload = {
    course_name: formData.get("courseName")?.toString().trim(),
    difficulty: formData.get("difficulty")?.toString(),
    test: formData.get("test")?.toString(),
    report: formData.get("report")?.toString(),
    attendance: formData.get("attendance")?.toString(),
    author: formData.get("author")?.toString().trim(),
    comment: formData.get("comment")?.toString().trim(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseClient.from("lecture_info").insert([payload]);
  if (error) {
    console.error("Supabase insert lecture_info failed:", error);
    alert("講義情報の登録中にエラーが発生しました。コンソールを確認してください。");
    return;
  }

  console.log("講義情報投稿成功:", data);
  alert("講義情報が登録されました。");
  setCooldown();
  lectureInfoForm.reset();
  closeModal(lectureInfoModal);
});

// ページング定義
const PAGE_SIZE = 50;
let pastPage = 1;
let lecturePage = 1;

// 閲覧機能
const viewPastButton = document.getElementById("view-past-question");
const viewLectureButton = document.getElementById("view-lecture-info");

const pastView = document.getElementById("past-question-view");
const lectureView = document.getElementById("lecture-info-view");

const filterPastCourse = document.getElementById("filter-past-courseName");
const pastQueryButton = document.getElementById("filter-past-query");
const clearPastButton = document.getElementById("clear-past-filter");
const pastResults = document.getElementById("past-results");
const pastPagination = document.getElementById("past-pagination");

const filterLectureCourse = document.getElementById("filter-lecture-courseName");
const filterLectureDifficulty = document.getElementById("filter-lecture-difficulty");
const filterLectureTest = document.getElementById("filter-lecture-test");
const filterLectureReport = document.getElementById("filter-lecture-report");
const filterLectureAttendance = document.getElementById("filter-lecture-attendance");
const lectureQueryButton = document.getElementById("filter-lecture-query");
const clearLectureButton = document.getElementById("clear-lecture-filter");
const lectureResults = document.getElementById("lecture-results");
const lecturePagination = document.getElementById("lecture-pagination");

viewPastButton.addEventListener("click", () => {
  pastPage = 1;
  pastView.classList.toggle("hidden");
  lectureView.classList.add("hidden");
  queryPast();
});

viewLectureButton.addEventListener("click", () => {
  lecturePage = 1;
  lectureView.classList.toggle("hidden");
  pastView.classList.add("hidden");
  queryLecture();
});

function renderResults(container, rows, isPast = true) {
  container.innerHTML = "";
  if (!rows || rows.length === 0) {
    container.textContent = "該当データがありませんでした。";
    return;
  }

  rows.forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-card";

    if (isPast) {
      card.innerHTML = `
        <p><strong>講義名:</strong> ${item.course_name}</p>
        <p><strong>過去問情報:</strong> ${item.past_info}</p>
        <p><strong>投稿者:</strong> ${item.author || "匿名"}</p>
        <p><small>${new Date(item.created_at).toLocaleString()}</small></p>
      `;
    } else {
      card.innerHTML = `
        <p><strong>講義名:</strong> ${item.course_name}</p>
        <p><strong>難易度:</strong> ${item.difficulty}</p>
        <p><strong>テスト:</strong> ${item.test}</p>
        <p><strong>レポート:</strong> ${item.report}</p>
        <p><strong>出席:</strong> ${item.attendance}</p>
        <p><strong>コメント:</strong> ${item.comment}</p>
        <p><small>${new Date(item.created_at).toLocaleString()}</small></p>
      `;
    }

    container.appendChild(card);
  });
}

function renderPagination(container, page, pageSize, totalCount, onChange) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  container.innerHTML = "";

  const pageInfo = document.createElement("span");
  pageInfo.className = "page-info";
  pageInfo.textContent = `ページ ${page} / ${totalPages}（全 ${totalCount} 件）`;
  container.appendChild(pageInfo);

  const prev = document.createElement("button");
  prev.className = "page-btn";
  prev.textContent = "前へ";
  prev.disabled = page <= 1;
  prev.addEventListener("click", () => onChange(page - 1));
  container.appendChild(prev);

  const next = document.createElement("button");
  next.className = "page-btn";
  next.textContent = "次へ";
  next.disabled = page >= totalPages;
  next.addEventListener("click", () => onChange(page + 1));
  container.appendChild(next);

  if (page > totalPages) {
    onChange(totalPages);
  }
}

async function queryPast() {
  let query = supabaseClient.from("past_questions").select("*", { count: "exact" });
  const course = filterPastCourse.value.trim();
  if (course) {
    query = query.ilike("course_name", `%${course}%`);
  }

  const from = (pastPage - 1) * PAGE_SIZE;
  const to = pastPage * PAGE_SIZE - 1;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("past_questions query error:", error);
    pastResults.textContent = "データの取得に失敗しました。";
    pastPagination.innerHTML = "";
    return;
  }

  renderResults(pastResults, data, true);
  renderPagination(pastPagination, pastPage, PAGE_SIZE, count || 0, (newPage) => {
    pastPage = newPage;
    queryPast();
  });
}

async function queryLecture() {
  let query = supabaseClient.from("lecture_info").select("*", { count: "exact" });
  const course = filterLectureCourse.value.trim();
  if (course) {
    query = query.ilike("course_name", `%${course}%`);
  }
  if (filterLectureDifficulty.value) {
    query = query.eq("difficulty", filterLectureDifficulty.value);
  }
  if (filterLectureTest.value) {
    query = query.eq("test", filterLectureTest.value);
  }
  if (filterLectureReport.value) {
    query = query.eq("report", filterLectureReport.value);
  }
  if (filterLectureAttendance.value) {
    query = query.eq("attendance", filterLectureAttendance.value);
  }

  const from = (lecturePage - 1) * PAGE_SIZE;
  const to = lecturePage * PAGE_SIZE - 1;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("lecture_info query error:", error);
    lectureResults.textContent = "データの取得に失敗しました。";
    lecturePagination.innerHTML = "";
    return;
  }

  renderResults(lectureResults, data, false);
  renderPagination(lecturePagination, lecturePage, PAGE_SIZE, count || 0, (newPage) => {
    lecturePage = newPage;
    queryLecture();
  });
}

pastQueryButton.addEventListener("click", () => {
  pastPage = 1;
  queryPast();
});
clearPastButton.addEventListener("click", () => {
  filterPastCourse.value = "";
  pastPage = 1;
  pastResults.innerHTML = "";
  pastPagination.innerHTML = "";
});

lectureQueryButton.addEventListener("click", () => {
  lecturePage = 1;
  queryLecture();
});
clearLectureButton.addEventListener("click", () => {
  filterLectureCourse.value = "";
  filterLectureDifficulty.value = "";
  filterLectureTest.value = "";
  filterLectureReport.value = "";
  filterLectureAttendance.value = "";
  lecturePage = 1;
  lectureResults.innerHTML = "";
  lecturePagination.innerHTML = "";
});

