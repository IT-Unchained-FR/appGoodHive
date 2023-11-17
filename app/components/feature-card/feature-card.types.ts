export type FeatureCardProps = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  btnText: string;
  onClickHandler: (id: string) => void;
};
