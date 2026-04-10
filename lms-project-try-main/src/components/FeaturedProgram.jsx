import styles from './FeaturedProgram.module.css'

const aiCourses = [
  {
    title: 'AI Fundamentals',
    image: 'https://picsum.photos/seed/ai1/300/180',
    duration: '1.2 hours',
    course: 'Course 1 of 7',
  },
  {
    title: 'AI for Brainstorming and Planning',
    image: 'https://picsum.photos/seed/ai2/300/180',
    duration: '21 mins',
    course: 'Course 2 of 7',
  },
  {
    title: 'AI for Research and Insights',
    image: 'https://picsum.photos/seed/ai3/300/180',
    duration: '31 mins',
    course: 'Course 3 of 7',
  },
  {
    title: 'AI for Writing and Communicating',
    image: 'https://picsum.photos/seed/ai4/300/180',
    duration: '29 mins',
    course: 'Course 4 of 7',
  },
]

function FeaturedProgram() {
  return (
    <section className={styles.wrapper}>
      {/* <h2 className={styles.heading}>Learn AI with Google</h2> */}

      <div className={styles.container}>
        
     
        {/* <div className={styles.left}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
            alt="Google"
            className={styles.logo}
          />

          <h3>Google AI Professional Certificate</h3>

          <p>
            Build your AI fluency and get more done, faster.
          </p>

          <div className={styles.meta}>
            ⭐ 4.6 &nbsp; | &nbsp; 729 ratings &nbsp; | &nbsp; 5 hours &nbsp; | &nbsp; 7 courses
          </div>

          <button className={styles.btn}>Learn more</button>
        </div> */}

        {/* RIGHT CARDS */}
        {/* <div className={styles.cards}>
          {aiCourses.map((item, index) => (
            <div key={index} className={styles.card}>
              <img src={item.image} alt={item.title} />
              
              <div className={styles.cardContent}>
                <h4>{item.title}</h4>

                <div className={styles.badges}>
                  <span>{item.course}</span>
                  <span>{item.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div> */}

      </div>
    </section>
  )
}

export default FeaturedProgram