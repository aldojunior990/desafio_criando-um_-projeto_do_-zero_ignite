import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Prismic from "@prismicio/client"
import { useRouter } from 'next/router';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {


  const words = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const word = contentItem.body.map(item => item.text.split(' ').length);
    word.map(w => (total += w))

    return total;
  }, 0)

  const Time = Math.ceil(words / 200)

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const date = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR
    }
  )

  return (
    <>

      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="imagem" className={styles.banner} />
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.postHeader}>
            <h2>{post.data.title}</h2>

            <ul>
              <li>
                <FiCalendar /> {date}
              </li>
              <li>
                <FiUser /> {post.data.author}
              </li>
              <li>
                <FiClock /> {`${Time} min`}
              </li>
            </ul>
          </div>

          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>

                <div className={styles.postContent}
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
                />
              </article>
            )
          })}



        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'publication')]
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })


  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('publication', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },

      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        }
      }),

    }
  }



  return {
    props: {
      post,
    }
  }
};
