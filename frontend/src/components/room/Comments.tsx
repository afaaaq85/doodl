
interface Comments {
    name: string;
    comment: string;
  }

const Comments = ({commentsData}: {commentsData: Comments[]}) => {
    console.log("comments data:",commentsData)
  return (
    <div className="w-full">
      <p className="font-bold">Comments</p>
      <ul className="flex flex-col gap-0 mt-2">
        {commentsData.map((comment, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="font-bold">{comment.name}:</span>
            <span>{comment.comment}</span>
          </li>
        ))}
        
      </ul>
    </div>
  );
};

export default Comments;
