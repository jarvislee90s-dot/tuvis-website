import { useTranslation } from "react-i18next";

export function SectionTitle({ tKey, sub }: { tKey: string; sub?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold md:text-3xl">{t(tKey)}</h2>
      {sub && <p className="mt-2 text-inkdim">{t(sub)}</p>}
    </div>
  );
}
