import Landing, { type Sweep } from './landing';
import sweepData from '../data/evaluation/landing-sweep.json';
import './landing.css';

export default function Page() {
  return <Landing sweep={sweepData as Sweep} />;
}
