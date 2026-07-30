import {
  useEffect,
  useState,
} from 'react';

import {
  haptic,
} from '../../lib/telegram';


const LETTERS = [
  'الف',
  'ب',
  'ج',
  'د',
  'هـ',
  'و',
];


export default function QuestionCard({
  question,
  onAnswer,
  answered,
  showReport = false,
  onReport,
}) {
  const [
    selected,
    setSelected,
  ] = useState(null);


  useEffect(() => {
    setSelected(null);
  }, [question?.id]);


  if (!question) {
    return null;
  }


  const options =
    Array.isArray(
      question.options
    )
      ? question.options
      : [];


  const choose = (index) => {
    if (
      answered != null ||
      selected != null
    ) {
      return;
    }

    setSelected(index);

    haptic('medium');

    onAnswer?.(
      question.id,
      index
    );
  };


  return (
    <article
      className={
        'card card-glow fade-up'
      }
      style={{
        padding:
          15,

        marginBottom:
          12,

        background:
          'linear-gradient(155deg,rgba(59,130,246,.08),rgba(16,24,39,.97) 42%)',
      }}
    >
      <div
        style={{
          display: 'flex',

          flexWrap: 'wrap',

          gap:
            5,

          marginBottom:
            12,
        }}
      >
        <span className="badge b-acc">
          📚{' '}

          {question.lesson ||
            'درس'}
        </span>

        {question.topic && (
          <span className="badge b-gray">
            📌 {question.topic}
          </span>
        )}

        <span
          className={`badge ${
            question.difficulty
              ?.includes('سخت')
              ? 'b-red'

              : question.difficulty
                  ?.includes('آسان')
                ? 'b-grn'

                : 'b-yel'
          }`}
          style={{
            marginRight:
              'auto',
          }}
        >
          {question.difficulty ||
            'متوسط 🟡'}
        </span>
      </div>


      <div
        style={{
          display: 'flex',

          alignItems:
            'flex-start',

          gap:
            9,

          marginBottom:
            15,
        }}
      >
        <span
          style={{
            display: 'grid',

            flex:
              '0 0 31px',

            height:
              31,

            placeItems:
              'center',

            color:
              '#fff',

            background:
              'var(--grad-brand)',

            borderRadius:
              10,

            fontSize:
              11,

            fontWeight:
              900,
          }}
        >
          ؟
        </span>

        <div
          style={{
            color:
              'var(--tx)',

            fontSize:
              13.5,

            fontWeight:
              700,

            lineHeight:
              1.9,
          }}
        >
          {question.question ||
            'متن سؤال موجود نیست'}
        </div>
      </div>


      <div
        style={{
          display:
            'grid',

          gap:
            8,
        }}
      >
        {options.map(
          (
            option,
            index
          ) => {
            const correct =
              answered != null &&
              index ===
                answered
                  .correct_answer;

            const wrongSelected =
              answered != null &&
              index === selected &&
              !correct;

            const chosen =
              selected === index;


            const border =
              correct
                ? 'rgba(16,185,129,.45)'

                : wrongSelected
                  ? 'rgba(239,68,68,.45)'

                  : chosen
                    ? 'var(--acc)'

                    : 'var(--bd)';


            const background =
              correct
                ? 'rgba(16,185,129,.12)'

                : wrongSelected
                  ? 'rgba(239,68,68,.12)'

                  : chosen
                    ? 'var(--acc-soft)'

                    : 'rgba(24,34,53,.72)';


            const color =
              correct
                ? 'var(--ok)'

                : wrongSelected
                  ? 'var(--err)'

                  : 'var(--tx)';


            return (
              <button
                type="button"
                key={index}
                className="q-option"
                onClick={() =>
                  choose(index)
                }
                disabled={
                  answered != null ||
                  selected != null
                }
                style={{
                  display:
                    'flex',

                  alignItems:
                    'flex-start',

                  width:
                    '100%',

                  gap:
                    10,

                  padding:
                    '10px 11px',

                  color,

                  textAlign:
                    'right',

                  background,

                  border:
                    `1px solid ${border}`,

                  borderRadius:
                    13,

                  cursor:
                    answered != null
                      ? 'default'
                      : 'pointer',

                  transition:
                    'transform .15s var(--ease-spring), border-color .2s, background .2s',
                }}
              >
                <span
                  style={{
                    display:
                      'grid',

                    flex:
                      '0 0 27px',

                    height:
                      27,

                    placeItems:
                      'center',

                    color:
                      correct ||
                      wrongSelected ||
                      chosen
                        ? color
                        : 'var(--txm)',

                    background:
                      correct
                        ? 'rgba(16,185,129,.15)'

                        : wrongSelected
                          ? 'rgba(239,68,68,.15)'

                          : 'var(--elev)',

                    borderRadius:
                      9,

                    fontSize:
                      10,

                    fontWeight:
                      900,
                  }}
                >
                  {LETTERS[index] ||
                    index + 1}
                </span>

                <span
                  style={{
                    flex:
                      1,

                    paddingTop:
                      3,

                    fontSize:
                      11.5,

                    lineHeight:
                      1.7,
                  }}
                >
                  {option}
                </span>

                {correct && (
                  <span>✓</span>
                )}

                {wrongSelected && (
                  <span>✕</span>
                )}
              </button>
            );
          }
        )}
      </div>


      {answered != null &&
        showReport && (
        <button
          type="button"
          onClick={onReport}
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              4,

            marginTop:
              10,

            padding:
              0,

            color:
              'var(--txm)',

            background:
              'none',

            border:
              0,

            fontSize:
              9.5,

            cursor:
              'pointer',
          }}
        >
          🚩 گزارش ایراد در این سؤال
        </button>
      )}
    </article>
  );
}
