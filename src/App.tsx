import "./App.css";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const fighters = [
  "マリオ",
  "ドンキーコング",
  "リンク",
  "サムス",
  "ダークサムス",
  "ヨッシー",
  "カービィ",
  "フォックス",
  "ピカチュウ",
  "ルイージ",
  "ネス",
  "キャプテン・ファルコン",
  "プリン",
  "ピーチ",
  "デイジー",
  "クッパ",
  "アイスクライマー",
  "シーク",
  "ゼルダ",
  "ドクターマリオ",
  "ピチュー",
  "ファルコ",
  "マルス",
  "ルキナ",
  "こどもリンク",
  "ガノンドロフ",
  "ミュウツー",
  "ロイ",
  "クロム",
  "Mr.ゲーム＆ウォッチ",
  "メタナイト",
  "ピット",
  "ブラックピット",
  "ゼロスーツサムス",
  "ワリオ",
  "スネーク",
  "アイク",
  "ポケモントレーナー",
  "ディディーコング",
  "リュカ",
  "ソニック",
  "デデデ",
  "ピクミン&オリマー",
  "ルカリオ",
  "ロボット",
  "トゥーンリンク",
  "ウルフ",
  "むらびと",
  "ロックマン",
  "Wii Fitトレーナー",
  "ロゼッタ＆チコ",
  "リトル・マック",
  "ゲッコウガ",
  "パルテナ",
  "パックマン",
  "ルフレ",
  "シュルク",
  "クッパJr.",
  "ダックハント",
  "リュウ",
  "ケン",
  "クラウド",
  "カムイ",
  "ベヨネッタ",
  "インクリング",
  "リドリー",
  "シモン",
  "リヒター",
  "キングクルール",
  "しずえ",
  "ガオガエン",
];

const fightersMii = [
  "Miiファイター（格闘タイプ）",
  "Miiファイター（剣術タイプ）",
  "Miiファイター（射撃タイプ）",
];

const fightersDlc = [
  "パックンフラワー",
  "ジョーカー",
  "勇者",
  "バンジョー&カズーイ",
  "テリー",
  "ベレス",
  "ミェンミェン",
  "スティーブ",
  "セフィロス",
  "ホムラ･ヒカリ",
  "カズヤ",
  "ソラ",
];

const shuffle = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const BingoCard = ({
  size,
  card,
  clickStates,
  setClickStates,
}: {
  size: number;
  card: string[][];
  clickStates: number[][];
  setClickStates: (clickStates: number[][]) => void;
}) => {
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const newClickStates = clickStates.map((row, i) =>
      row.map((cell, j) => (i === rowIndex && j === colIndex ? (cell + 1) % 3 : cell))
    );
    setClickStates(newClickStates);
  };

  const getCellColor = (clickState: number) => {
    switch (clickState) {
      case 1:
        return "red";
      case 2:
        return "blue";
      default:
        return "white";
    }
  };
  const getTextColor = (clickState: number) => {
    switch (clickState) {
      case 1:
        return "white";
      case 2:
        return "white";
      default:
        return "black";
    }
  };

  const cellSize = Math.max(30, Math.min(80, 400 / size));

  return (
    <div className="bingo-card">
      <table>
        <tbody>
          {card.map((row, i) => (
            <tr key={i}>
              {row.map((item, j) => (
                <td
                  key={j}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    fontSize: `${Math.max(10, cellSize / 5)}px`,
                    backgroundColor: getCellColor(clickStates[i][j]),
                    color: getTextColor(clickStates[i][j]),
                    cursor: "pointer",
                  }}
                  onClick={() => handleCellClick(i, j)}
                >
                  {item}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BingoGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryFighters = useMemo(
    () => searchParams.get("fighters")?.split(",") || [],
    [searchParams]
  );
  const querySize = useMemo(() => Number(searchParams.get("size")) || 5, [searchParams]);

  const [size, setSize] = useState<number>(5);
  const [card, setCard] = useState<string[][]>([]);
  const [clickStates, setClickStates] = useState<number[][]>([]);

  const generateCard = (size: number, includeDlc: boolean, includeMii: boolean) => {
    const shuffled = shuffle([
      ...fighters,
      ...(includeDlc ? fightersDlc : []),
      ...(includeMii ? fightersMii : []),
    ]);
    const newCard = Array(size)
      .fill("")
      .map(() => shuffled.splice(0, size));

    const newFighters = newCard.flat().join(",");
    navigate(`?size=${size}&fighters=${encodeURIComponent(newFighters)}`);
    setCard(newCard);

    setClickStates(
      Array(size)
        .fill("")
        .map(() => Array(size).fill(0))
    );
  };

  useEffect(() => {
    console.log(querySize, queryFighters);
    if (querySize && queryFighters.length === querySize * querySize) {
      const newCard = Array(querySize)
        .fill("")
        .map(() => queryFighters.splice(0, querySize));
      setCard(newCard);
      console.log(querySize, queryFighters, newCard);
      setClickStates(
        Array(querySize)
          .fill("")
          .map(() => Array(querySize).fill(0))
      );
    }
  }, [querySize, queryFighters]);

  return (
    <div className="bingo-generator">
      <h1>スマブラビンゴ</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const DLC = form.get("DLC") || false;
          const Mii = form.get("Mii") || false;
          generateCard(size, !!DLC, !!Mii);
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px" }}>
          <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={3}>3x3</option>
            <option value={5}>5x5</option>
            <option value={7}>7x7</option>
          </select>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
            <input
              type="checkbox"
              id="DLC"
              name="DLC"
              style={{ transform: "scale(2)", margin: "0 6px 0 0" }}
            />
            <label htmlFor="DLC">DLCを含む</label>
          </div>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
            <input
              type="checkbox"
              id="Mii"
              name="Mii"
              style={{ transform: "scale(2)", margin: "0 6px 0 0" }}
            />
            <label htmlFor="Mii">Miiを含む</label>
          </div>
        </div>
        <button style={{ color: "white" }} type="submit">
          新しいビンゴカードを生成
        </button>
      </form>
      <BingoCard
        size={size}
        card={card}
        clickStates={clickStates}
        setClickStates={setClickStates}
      />
    </div>
  );
};

// スタイルを適用
const styles = `
  .bingo-generator {
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background-color: white;
  }
  .bingo-card table {
    border-collapse: collapse;
    margin: 20px auto;
  }
  .bingo-card td {
    border: 1px solid #000;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    transition: background-color 0.3s ease;
  }
  button, select {
    font-size: 16px;
    padding: 10px 20px;
    margin: 10px;
    cursor: pointer;
  }
`;

const StyleWrapper = ({ children }: { children: React.ReactNode }) => (
  <>
    <style>{styles}</style>
    {children}
  </>
);

function App() {
  return (
    <>
      <StyleWrapper>
        <BingoGenerator />
      </StyleWrapper>
    </>
  );
}

export default App;
