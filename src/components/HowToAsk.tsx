import { useTranslation } from 'react-i18next';

function HowToAsk() {
  const { t } = useTranslation();

  return (
    <section className="how-to-ask">
      <h2>{t('how_to_ask_title')}</h2>
      <p>{t('how_to_ask_intro')}</p>
      <h4>{t('how_to_ask_step1_title')}</h4>
      <p>{t('how_to_ask_step1_text')}</p>
      <h4>{t('how_to_ask_step2_title')}</h4>
      <p>{t('how_to_ask_step2_text')}</p>
      <h4>{t('how_to_ask_step3_title')}</h4>
      <p>{t('how_to_ask_step3_text')}</p>
      <h4>{t('how_to_ask_step4_title')}</h4>
      <p>{t('how_to_ask_step4_text')}</p>
      <h4>{t('how_to_ask_examples_title')}</h4>
      <p>{t('how_to_ask_examples_intro')}</p>
      <ul>
        <li>{t('how_to_ask_example1')}</li>
        <li>{t('how_to_ask_example2')}</li>
        <li>{t('how_to_ask_example3')}</li>
      </ul>
    </section>
  );
}

export default HowToAsk;
