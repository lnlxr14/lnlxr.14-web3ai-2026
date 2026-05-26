document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const vocalRangeSlider = document.getElementById('vocal-range');
  const vocalRangeVal = document.getElementById('vocal-range-val');
  const artistChips = document.querySelectorAll('.chip');
  const memberSelectors = document.querySelectorAll('#member-selector .selector-btn');
  const moodSelectors = document.querySelectorAll('#mood-selector .selector-btn');
  const btnSubmit = document.getElementById('btn-submit');
  const btnRetry = document.getElementById('btn-retry');
  
  const configSection = document.querySelector('.config-section');
  const loadingArea = document.getElementById('loading-area');
  const resultsArea = document.getElementById('results-area');
  const recommendationsContainer = document.getElementById('recommendations-container');
  const loadingTip = document.getElementById('loading-tip');

  // State
  const state = {
    vocalLevel: 2, // 1: 低音, 2: 中音, 3: 高音
    selectedArtists: [],
    member: 'boss',
    mood: 'hype'
  };

  // --- Event Listeners ---

  // 音域スライダー（100段階のスムーズなドラッグに対応）
  vocalRangeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    let level;
    let labelHTML;
    
    if (val < 35) {
      level = 1;
      labelHTML = '<span class="badge" style="background:rgba(157,0,255,0.2);color:#bd00ff;border:1px solid #bd00ff">低音域 (ロー)</span>';
    } else if (val > 65) {
      level = 3;
      labelHTML = '<span class="badge" style="background:rgba(255,0,122,0.2);color:#ff007a;border:1px solid #ff007a">高音域 (ハイ)</span>';
    } else {
      level = 2;
      labelHTML = '<span class="badge bg-cyan">中音域 (標準)</span>';
    }
    
    state.vocalLevel = level;
    vocalRangeVal.innerHTML = labelHTML;
  });

  // アーティストチップ（複数選択トグル）
  artistChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const artistId = chip.dataset.artist;
      if (chip.classList.contains('selected')) {
        state.selectedArtists.push(artistId);
      } else {
        state.selectedArtists = state.selectedArtists.filter(id => id !== artistId);
      }
    });
  });

  // セレクター（単一選択）
  function setupSelector(selectors, stateKey) {
    selectors.forEach(btn => {
      btn.addEventListener('click', () => {
        selectors.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[stateKey] = btn.dataset.value;
      });
    });
  }
  setupSelector(memberSelectors, 'member');
  setupSelector(moodSelectors, 'mood');

  // 実行ボタン
  btnSubmit.addEventListener('click', () => {
    startMatching();
  });

  // リトライボタン
  btnRetry.addEventListener('click', () => {
    resultsArea.classList.add('hidden');
    configSection.classList.remove('hidden');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Logic ---

  function startMatching() {
    // UI切り替え
    configSection.classList.add('hidden');
    loadingArea.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ローディング中のテキスト切り替えアニメーション
    const tips = [
      "シチュエーションに応じた盛り上がり度をシミュレートしています...",
      "あなたの音域と楽曲のキーをマッチング中...",
      "同席メンバーの世代データから最適解を抽出中..."
    ];
    let tipIdx = 0;
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % tips.length;
      loadingTip.textContent = tips[tipIdx];
    }, 800);

    // モックの遅延 (2.5秒)
    setTimeout(() => {
      clearInterval(tipInterval);
      loadingArea.classList.add('hidden');
      generateAndShowResults();
    }, 2500);
  }

  function generateAndShowResults() {
    // 状態に基づいてモックデータを生成
    const recommendations = getMockRecommendations(state);
    
    // HTML生成
    recommendationsContainer.innerHTML = '';
    
    recommendations.forEach((rec, index) => {
      const isTopPick = index === 0;
      
      const card = document.createElement('div');
      card.className = `result-card ${isTopPick ? 'top-pick' : ''}`;
      
      card.innerHTML = `
        <div class="song-info">
          <h3>${rec.title}</h3>
          <div class="song-artist">アーティスト: ${rec.artist}</div>
        </div>
        
        <div class="metrics">
          <div class="metric-row">
            <span class="metric-label">🎤 音域マッチ</span>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill vocal" style="width: ${rec.vocalMatch}%"></div>
            </div>
            <span class="metric-value">${rec.vocalMatch}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">🔥 盛り上がり</span>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill hype" style="width: ${rec.hypeMatch}%"></div>
            </div>
            <span class="metric-value">${rec.hypeMatch}%</span>
          </div>
        </div>

        <div class="ai-comment">
          <span class="ai-icon">💡</span>
          <p>${rec.comment}</p>
        </div>
      `;
      
      recommendationsContainer.appendChild(card);
    });

    resultsArea.classList.remove('hidden');
  }

  // --- Mock Engine ---
  
  function getMockRecommendations(currentState) {
    // 本来はAI/DB検索が入る部分。今回は入力の組み合わせに応じてそれらしい結果を返す。
    
    let topPick = {};
    let secondPick = {};
    let thirdPick = {};

    const isLow = currentState.vocalLevel === 1;
    const isMid = currentState.vocalLevel === 2;
    const isHigh = currentState.vocalLevel === 3;

    // --- シチュエーションごとの基本選曲 ---
    if (currentState.member === 'boss') {
      // 会社の上告・同僚
      if (isHigh) {
        topPick = { title: "チェリー", artist: "スピッツ", vocalMatch: 95, hypeMatch: 98, comment: "上司世代の超ド定番！あなたの高音ボイスなら原曲キーで美しく歌い上げられ、拍手喝采間違いなしです。" };
        secondPick = { title: "浪漫飛行", artist: "米米CLUB", vocalMatch: 88, hypeMatch: 92, comment: "疾走感があり上司ウケ抜群。高音が得意なあなたにぴったりの伸びやかなメロディです。" };
        thirdPick = { title: "粉雪", artist: "レミオロメン", vocalMatch: 92, hypeMatch: 85, comment: "サビの高音ドッカン系。少しエモい空気にしたい時に上司も一緒に口ずさめる名曲です。" };
      } else if (isLow) {
        topPick = { title: "桜坂", artist: "福山雅治", vocalMatch: 98, hypeMatch: 90, comment: "低音の魅力を最大限に活かせる名曲。上司世代にも知名度抜群で、渋くかっこよく歌いこなせます。" };
        secondPick = { title: "世界に一つだけの花", artist: "SMAP", vocalMatch: 95, hypeMatch: 96, comment: "音域が低〜中音域で安定しており、無理なく歌えます。全員で手拍子できる最強の安全牌です。" };
        thirdPick = { title: "TSUNAMI", artist: "サザンオールスターズ", vocalMatch: 90, hypeMatch: 88, comment: "キーが低めで落ち着いて歌えるサザンの大ヒット曲。サビの盛り上がりもしっかり作れます。" };
      } else {
        // 中音域
        topPick = { title: "世界に一つだけの花", artist: "SMAP", vocalMatch: 98, hypeMatch: 96, comment: "音域が広くなく、無理せず歌えて誰もが知っている最強の安全牌です。" };
        secondPick = { title: "サウダージ", artist: "ポルノグラフィティ", vocalMatch: 89, hypeMatch: 94, comment: "リズムに乗りやすく、中〜低音域でもしっかり魅せられる一曲。上司からの評価も高いです。" };
        thirdPick = { title: "夏色", artist: "ゆず", vocalMatch: 85, hypeMatch: 90, comment: "【キー：-2推奨】手拍子で確実な盛り上がりを作れるテッパン曲。サビの高音だけキーを少し下げると格段に歌いやすくなります。" };
      }
    } else if (currentState.mood === 'emotional') {
      // エモい・しっとり
      if (isLow) {
        topPick = { title: "桜坂", artist: "福山雅治", vocalMatch: 99, hypeMatch: 88, comment: "低音域の方にとっての最強の勝負曲。Aメロの深い響きからサビまで、無理なくエモい世界観を作れます。" };
        secondPick = { title: "Lemon", artist: "米津玄師", vocalMatch: 68, hypeMatch: 93, comment: "【キー：-4設定推奨】原曲はかなり高めですが、キーを4つ下げることで低音の深みが活き、エモさが倍増します。" };
        thirdPick = { title: "ドライフラワー", artist: "優里", vocalMatch: 70, hypeMatch: 90, comment: "【キー：-3設定推奨】サビの高音がきつい場合はキーを3つ下げるのがおすすめ。男らしい切なさが表現できます。" };
      } else if (isHigh) {
        topPick = { title: "マリーゴールド", artist: "あいみょん", vocalMatch: 96, hypeMatch: 91, comment: "原曲キーで気持ちよく歌えるエモ曲。あなたの伸びやかなハイトーンに完璧にフィットします。" };
        secondPick = { title: "Lemon", artist: "米津玄師", vocalMatch: 94, hypeMatch: 95, comment: "サビの高音も原曲キーでバッチリ綺麗に出せます。その場を一気にエモい空気感に引き込めます。" };
        thirdPick = { title: "ドライフラワー", artist: "優里", vocalMatch: 95, hypeMatch: 92, comment: "サビのハイトーンの聴かせどころを、あなたの美しい高音ボイスで完璧に再現できます。" };
      } else {
        // 中音域
        topPick = { title: "マリーゴールド", artist: "あいみょん", vocalMatch: 94, hypeMatch: 91, comment: "世代を問わず響くエモさ。無理のない音域で、感情を込めて歌いやすいメロディラインです。" };
        secondPick = { title: "Lemon", artist: "米津玄師", vocalMatch: 88, hypeMatch: 95, comment: "【キー：-2推奨】エモい曲の代名詞。サビの高音を2つ下げることで、喉を痛めず気持ちよく歌いきれます。" };
        thirdPick = { title: "ドライフラワー", artist: "優里", vocalMatch: 90, hypeMatch: 92, comment: "【キー：-1推奨】少し高めですが、キーを1つ下げるだけでサビのラストまで安定して歌唱可能です。" };
      }
    } else if (currentState.mood === 'singalong') {
      // みんなで大合唱
      if (isLow) {
        topPick = { title: "小さな恋のうた", artist: "MONGOL800", vocalMatch: 96, hypeMatch: 99, comment: "【1オクターブ下推奨】原曲キーのまま「1オクターブ下」で歌うと、低音に完璧にハマり、周りも全員で大合唱できます！" };
        secondPick = { title: "天体観測", artist: "BUMP OF CHICKEN", vocalMatch: 94, hypeMatch: 96, comment: "BUMPの曲はもともと低めの音域で作られているため、低音ボイスのあなたでも原曲キーでとても歌いやすい合唱曲です。" };
        thirdPick = { title: "残酷な天使のテーゼ", artist: "高橋洋子", vocalMatch: 60, hypeMatch: 98, comment: "【キー：-5設定推奨】キーを5つ下げる（あるいはオク下で歌う）ことで、無理なくサビを全員で大合唱してブチ上がれます！" };
      } else {
        topPick = { title: "小さな恋のうた", artist: "MONGOL800", vocalMatch: 92, hypeMatch: 99, comment: "全員で叫ぶように歌える合唱の王様！音程を気にせず、勢いでカバーできるのも強みです。" };
        secondPick = { title: "天体観測", artist: "BUMP OF CHICKEN", vocalMatch: 95, hypeMatch: 96, comment: "「オーイエーアハーン」の掛け声で一体感が生まれます。中音域が中心で非常に歌いやすいです。" };
        thirdPick = { title: "残酷な天使のテーゼ", artist: "高橋洋子", vocalMatch: 88, hypeMatch: 98, comment: "アニメを知らなくても盛り上がる国民的アンセム。サビは全員で熱唱必至！" };
      }
    } else {
      // とにかく盛り上がる（Default: hype）
      if (isLow) {
        topPick = { title: "怪獣の花唄", artist: "Vaundy", vocalMatch: 75, hypeMatch: 97, comment: "【キー：-4設定推奨】原曲は非常に高いですが、キーを4つ下げることで低音のパンチが効いたパワフルな盛り上がりを作れます！" };
        secondPick = { title: "アイドル", artist: "YOASOBI", vocalMatch: 58, hypeMatch: 99, comment: "【キー：-6設定 または 1オクターブ下推奨】原曲キーでは歌唱不可能ですが、キーを限界まで下げるかオク下にすることで、リズム感のあるクールな低音ラップとして抜群に盛り上がります！" };
        thirdPick = { title: "Pretender", artist: "Official髭男dism", vocalMatch: 62, hypeMatch: 94, comment: "【キー：-4設定推奨】超高音曲ですが、キーを4つ下げれば男らしい渋いハスキーボイスでサビを気持ちよく響かせられます。" };
      } else if (isHigh) {
        topPick = { title: "怪獣の花唄", artist: "Vaundy", vocalMatch: 98, hypeMatch: 97, comment: "原曲キーで完璧にフィット！サビのハイトーンの疾走感を損なわず、場を最高潮にブチ上げられます！" };
        secondPick = { title: "アイドル", artist: "YOASOBI", vocalMatch: 92, hypeMatch: 99, comment: "超高難易度のハイトーン曲ですが、高音が得意なあなたなら原曲キーで歌いこなし、全員を圧倒できます！" };
        thirdPick = { title: "Pretender", artist: "Official髭男dism", vocalMatch: 96, hypeMatch: 94, comment: "サビの最高音もクリアに発声可能。原曲キーの美しさをそのままに、会場を沸かせられる一曲です。" };
      } else {
        // 中音域
        topPick = { title: "怪獣の花唄", artist: "Vaundy", vocalMatch: 96, hypeMatch: 97, comment: "今のトレンドど真ん中で、サビの爆発力も圧倒的。あなたの声質なら疾走感を損なわず歌いきれます。" };
        secondPick = { title: "アイドル", artist: "YOASOBI", vocalMatch: 82, hypeMatch: 99, comment: "【キー：-3推奨】原曲キーはかなり高いため、キーを3つ下げることでサビの高音も力強くクリアに発声できるようになります。" };
        thirdPick = { title: "Pretender", artist: "Official髭男dism", vocalMatch: 85, hypeMatch: 94, comment: "【キー：-2推奨】誰もが知る名曲。キーを2つ下げることで、サビの伸びやかなメロディをコントロールしやすくなります。" };
      }
    }

    // もし得意なアーティストに「あいみょん」が入っていて、topPickがあいみょんでなければ強引に差し込む（モック的な演出）
    if (currentState.selectedArtists.includes('aimyon') && topPick.artist !== 'あいみょん') {
      thirdPick = { ...topPick };
      topPick = { title: "君はロックを聴かない", artist: "あいみょん", vocalMatch: 98, hypeMatch: 92, comment: "あなたがよく歌うアーティストからの選出！歌い慣れた曲調で、今のシチュエーションにもバッチリハマります。" };
    } else if (currentState.selectedArtists.includes('yonezu') && topPick.artist !== '米津玄師') {
      thirdPick = { ...topPick };
      topPick = { title: "KICK BACK", artist: "米津玄師", vocalMatch: 93, hypeMatch: 96, comment: "得意な米津玄師の中から、今の空気を最高にブチ上げる一曲。あなたの声の太さが活きます。" };
    }

    return [topPick, secondPick, thirdPick];
  }
});
