import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar, FiUser } from 'react-icons/fi'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Prismic from "@prismicio/client"

import Link from 'next/link'
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {


  const FormatPost = postsPagination.results.map(p => {
    return {
      ...p,
      first_publication_date: format(
        new Date(p.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      )
    }
  })

  const [posts, setPosts] = useState<Post[]>(FormatPost)
  const [page, setPage] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1)



  async function handleNextPage() {
    if (currentPage !== 1 && page === null) {
      return
    }

    const postResul = await fetch(`${page}`).then(response => response.json())

    setPage(postResul.next_page);
    setCurrentPage(postResul.page)

    const newPosts = postResul.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    })

    setPosts([...posts, ...newPosts])
  }


  return (
    <>
      <Head>
        <title>{`spacetraveling`}</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.posts}>
          {
            posts.map(post => {
              return (
                <Link href={`/post/${post.uid} `} key={post.uid}>
                  <a className={styles.singlePost}>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <ul>
                      <li>
                        <FiCalendar /> {post.first_publication_date}
                      </li>
                      <li>
                        <FiUser /> {post.data.author}
                      </li>
                    </ul>
                  </a>
                </Link>
              )
            })
          }

          {page && (
            <button onClick={handleNextPage}>Carregar mais posts</button>
          )}

        </div>


      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([Prismic.Predicates.at('document.type', 'publication')],
    {
      pageSize: 1,
    }
  );


  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }

  return {
    props: {
      postsPagination,
    }
  }
};
