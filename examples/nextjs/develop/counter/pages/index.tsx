import Head from "next/head";
import Counter from "../components/Counter";

export default function Home() {
  return (
    <div >
      <Head>
        <title>Counter</title>
        <meta name={'keywords'} content={'counter, agilets'}/>
      </Head>
        <Counter />
    </div>
  )
}
